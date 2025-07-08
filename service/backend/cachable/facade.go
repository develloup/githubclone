package cachable

import (
	"context"
	"githubclone-backend/api/github"
	"githubclone-backend/cache"
	"time"
)

type CacheFacade struct {
	ConfigValueCache                        *cache.TypedCache[ConfigurationValue]
	GitHubRepositoriesOfViewerCache         *cache.TypedCache[github.GitHubRepositoriesOfViewer]
	GitHubRepositoryNodeWithAttributesCache *cache.TypedCache[github.RepositoryNodeWithAttributes]
	GitHubRepositoryBranchCommitCache       *cache.TypedCache[github.RepositoryBranchCommit]
	GitHubRepositoryContributorCache        *cache.TypedCache[github.RepositoryContributor]
	GitHubFileCache                         *cache.TypedCache[github.GitHubFile]
	GitHubRepositoryTreeCommit              *cache.TypedCache[github.RepositoryTreeCommit]
}

func newTypedCache[T any](ctx context.Context, backend cache.CacheBackend, name string, persist bool, ttl time.Duration) *cache.TypedCache[T] {
	return cache.NewTypedCache[T](ctx, backend, name, persist, cache.FixedTTL{Duration: ttl})
}

func NewCacheFacade(ctx context.Context, backend cache.CacheBackend) *CacheFacade {
	return &CacheFacade{
		ConfigValueCache:                        newTypedCache[ConfigurationValue](ctx, backend, "config", true, 5*time.Minute),
		GitHubRepositoriesOfViewerCache:         newTypedCache[github.GitHubRepositoriesOfViewer](ctx, backend, "githubrepositoriesofviewer", true, 10*time.Minute),
		GitHubRepositoryNodeWithAttributesCache: newTypedCache[github.RepositoryNodeWithAttributes](ctx, backend, "githubrepositorynodewithattributes", true, 10*time.Minute),
		GitHubRepositoryBranchCommitCache:       newTypedCache[github.RepositoryBranchCommit](ctx, backend, "githubrepositorybranchcommit", true, 10*time.Minute),
		GitHubRepositoryContributorCache:        newTypedCache[github.RepositoryContributor](ctx, backend, "githubrepositorycontributor", true, 20*time.Minute),
		GitHubFileCache:                         newTypedCache[github.GitHubFile](ctx, backend, "githubfile", true, 20*time.Minute),
		GitHubRepositoryTreeCommit:              newTypedCache[github.RepositoryTreeCommit](ctx, backend, "githubrepositorytreecommit", true, 20*time.Minute),
	}
}

// func NewCacheFacade(ctx context.Context, backend cache.CacheBackend) *CacheFacade {
// 	return &CacheFacade{
// 		ConfigValueCache: cache.NewTypedCache[ConfigurationValue](
// 			ctx,
// 			backend,
// 			"config",
// 			true,
// 			cache.FixedTTL{Duration: 5 * time.Minute},
// 		),
// 		GitHubRepositoriesOfViewerCache: cache.NewTypedCache[github.GitHubRepositoriesOfViewer](
// 			ctx,
// 			backend,
// 			"githubrepositoriesofviewer",
// 			true,
// 			cache.FixedTTL{Duration: 10 * time.Minute},
// 		),
// 		GitHubRepositoryNodeWithAttributesCache: cache.NewTypedCache[github.RepositoryNodeWithAttributes](
// 			ctx,
// 			backend,
// 			"githubrepositorynodewithattributes",
// 			true,
// 			cache.FixedTTL{Duration: 10 * time.Minute},
// 		),
// 		GitHubRepositoryBranchCommitCache: cache.NewTypedCache[github.RepositoryBranchCommit](
// 			ctx,
// 			backend,
// 			"githubrepositorybranchcommit",
// 			true,
// 			cache.FixedTTL{Duration: 10 * time.Minute},
// 		),
// 		GitHubRepositoryContributorCache: cache.NewTypedCache[github.RepositoryContributor](
// 			ctx,
// 			backend,
// 			"githubrepositorycontributor",
// 			true,
// 			cache.FixedTTL{Duration: 20 * time.Minute},
// 		),
// 		GitHubFileCache: cache.NewTypedCache[github.GitHubFile](
// 			ctx,
// 			backend,
// 			"githubrepositorycontributor",
// 			true,
// 			cache.FixedTTL{Duration: 20 * time.Minute},
// 		),
// 	}
// }
