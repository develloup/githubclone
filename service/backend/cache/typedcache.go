package cache

import (
	"context"
	"fmt"
	"time"
)

// TTLPolicy erlaubt flexible TTL-Strategien (z. B. pro Typ, Keyspace, etc.)
type TTLPolicy interface {
	TTLForKey(key string) time.Duration
}

// FixedTTL ist eine einfache Strategie mit fixer Dauer
type FixedTTL struct {
	Duration time.Duration
}

func (f FixedTTL) TTLForKey(_ string) time.Duration {
	return f.Duration
}

// TypedCache[T] bietet typsicheren Zugriff auf den Cache
type TypedCache[T any] struct {
	ctx       context.Context
	backend   CacheBackend
	prefix    string    // z. B. "user" → Key wird zu "user:42"
	persist   bool      // ob Redis verwendet wird
	ttlPolicy TTLPolicy // z. B. FixedTTL
}

// NewTypedCache erstellt einen neuen TypedCache für Typ T
func NewTypedCache[T any](
	ctx context.Context,
	backend CacheBackend,
	prefix string,
	persist bool,
	ttl TTLPolicy,
) *TypedCache[T] {
	return &TypedCache[T]{
		ctx:       ctx,
		backend:   backend,
		prefix:    prefix,
		persist:   persist,
		ttlPolicy: ttl,
	}
}

// buildKey fügt Prefix hinzu
func (c *TypedCache[T]) buildKey(key string) string {
	return fmt.Sprintf("%s:%s", c.prefix, key)
}

// Get lädt ein Objekt vom Typ T aus dem Cache
func (c *TypedCache[T]) Get(key string) (*T, bool, error) {
	// return nil, false, nil
	var val T
	fullKey := c.buildKey(key)
	found, err := c.backend.Get(fullKey, &val)
	if err != nil || !found {
		return nil, false, err
	}
	return &val, true, nil
}

// Set schreibt ein Objekt vom Typ T in den Cache, ggf. mit TTL
func (c *TypedCache[T]) Set(key string, val T) error {
	fullKey := c.buildKey(key)

	// TTL temporär an MultiLevelCache durchreichen, wenn nötig
	if mlc, ok := c.backend.(*MultiLevelCache); ok {
		prevTTL := mlc.ttl
		mlc.ttl = c.ttlPolicy.TTLForKey(key)
		defer func() { mlc.ttl = prevTTL }()
	}

	return c.backend.Set(fullKey, val, c.persist)
}
