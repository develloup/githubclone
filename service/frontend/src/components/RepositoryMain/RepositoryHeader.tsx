import { ExtendedRepository } from "@/types/typesRepository"
import { RepositoryActions } from "./RepositoryHeader/RepositoryActions"
import { RepositoryForkOriginInfo } from "./RepositoryHeader/RepositoryForkOriginInfo"
import { RepositoryInfo } from "./RepositoryHeader/RepositoryInfo"

export type RepositoryHeaderProps = {
  repository: ExtendedRepository;
  provider: string;
  currentPath: string
}

export function RepositoryHeader({ repository, provider, currentPath }: RepositoryHeaderProps) {
  // console.log("RepositoryHeader: repository=", repository)
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <RepositoryInfo
          name={repository.name}
          currentPath={currentPath}
          owner={repository.owner}
          isPrivate={repository.isPrivate}
          isArchived={repository.isArchived}
        />
        <RepositoryActions
          watchers={repository.watchers.totalCount}
          forkCount={repository.forkCount}
          stargazers={repository.stargazerCount}
        />
      </div>

      {repository.isFork && repository.parent && (
        <RepositoryForkOriginInfo parent={repository.parent} provider={provider} />
      )}
    </div>
  )
}
