import { ExtendedRepository } from "@/types/typesRepository"
import { RepositoryTableSelector } from "./RepositoryTableHeader/RepositoryTableSelector"
import { RepositoryTableControls } from "./RepositoryTableHeader/RepositoryTableControls"

export type RepositoryTableHeaderProps = {
  repository: ExtendedRepository
  currentPath: string
  onRefSelect: (type: "branch" | "tag", name: string) => void
}

export function RepositoryTableHeader({
  repository,
  currentPath,
  onRefSelect
}: RepositoryTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <RepositoryTableSelector
        defaultBranch={repository.defaultBranchRef.name}
        selected={repository.defaultBranchRef.name}
        branches={repository.branches.nodes.map(b => b.name)}
        tags={repository.tags.nodes.map(t => t.name)}
        branchCount={repository.branches.totalCount}
        tagCount={repository.tags.totalCount}
        currentPath={currentPath}
        onSelect={onRefSelect}
      />
      <RepositoryTableControls />
    </div>
  )
}
