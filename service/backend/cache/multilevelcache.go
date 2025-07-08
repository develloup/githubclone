package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/redis/go-redis/v9"
)

type MultiLevelCache struct {
	ram   *ristretto.Cache
	redis *redis.Client
	ctx   context.Context
	ttl   time.Duration
}

func NewMultiLevelCache(redisAddr string, ttl time.Duration) (*MultiLevelCache, error) {
	ramCache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1e4,
		MaxCost:     1 << 29, // 512MB
		BufferItems: 64,
	})
	if err != nil {
		return nil, err
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	return &MultiLevelCache{
		ram:   ramCache,
		redis: redisClient,
		ctx:   context.Background(),
		ttl:   ttl,
	}, nil
}

func (c *MultiLevelCache) Close() error {
	return c.redis.Close()
}

func (c *MultiLevelCache) Get(key string, dest interface{}) (bool, error) {
	// 1. RAM
	if val, found := c.ram.Get(key); found {
		bytes, ok := val.([]byte)
		if !ok {
			return false, nil
		}
		return true, json.Unmarshal(bytes, dest)
	}

	// 2. Redis
	val, err := c.redis.Get(c.ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	} else if err != nil {
		return false, err
	}

	// 3. RAM-Update
	c.ram.Set(key, val, int64(len(val)))
	return true, json.Unmarshal(val, dest)
}

func (c *MultiLevelCache) Set(key string, val interface{}, persist bool) error {
	bytes, err := json.Marshal(val)
	if err != nil {
		return err
	}

	// Always RAM
	c.ram.Set(key, bytes, int64(len(bytes)))

	// Optional Redis
	if persist {
		return c.redis.Set(c.ctx, key, bytes, c.ttl).Err()
	}
	return nil
}
