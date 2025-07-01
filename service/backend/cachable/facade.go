package cachable

import (
	"context"
	"githubclone-backend/cache"
	"time"
)

type CacheFacade struct {
	ConfigValueCache *cache.TypedCache[ConfigurationValue]
}

func NewCacheFacade(ctx context.Context, backend cache.CacheBackend) *CacheFacade {
	return &CacheFacade{
		ConfigValueCache: cache.NewTypedCache[ConfigurationValue](ctx, backend, "config", true, cache.FixedTTL{Duration: 5 * time.Minute}),
	}
}
