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
}

func NewCacheFacade(ctx context.Context, backend cache.CacheBackend) *CacheFacade {
	return &CacheFacade{
		ConfigValueCache: cache.NewTypedCache[ConfigurationValue](
			ctx,
			backend,
			"config",
			true,
			cache.FixedTTL{Duration: 5 * time.Minute},
		),
		GitHubRepositoriesOfViewerCache: cache.NewTypedCache[github.GitHubRepositoriesOfViewer](
			ctx,
			backend,
			"githubrepositoriesofviewer",
			false,
			cache.FixedTTL{Duration: 10 * time.Minute},
		),
		GitHubRepositoryNodeWithAttributesCache: cache.NewTypedCache[github.RepositoryNodeWithAttributes](
			ctx,
			backend,
			"githubrepositorynodewithattributes",
			false,
			cache.FixedTTL{Duration: 10 * time.Minute},
		),
		GitHubRepositoryBranchCommitCache: cache.NewTypedCache[github.RepositoryBranchCommit](
			ctx,
			backend,
			"githubrepositorybranchcommit",
			false,
			cache.FixedTTL{Duration: 10 * time.Minute},
		),
		GitHubRepositoryContributorCache: cache.NewTypedCache[github.RepositoryContributor](
			ctx,
			backend,
			"githubrepositorycontributor",
			false,
			cache.FixedTTL{Duration: 20 * time.Minute},
		),
		GitHubFileCache: cache.NewTypedCache[github.GitHubFile](
			ctx,
			backend,
			"githubrepositorycontributor",
			false,
			cache.FixedTTL{Duration: 20 * time.Minute},
		),
	}
}
