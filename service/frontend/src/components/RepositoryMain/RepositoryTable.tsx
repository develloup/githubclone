import { RepositoryTableCommitInfo } from "./RepositoryTable/RepositoryTableCommitInfo"
import { RepositoryCommitTarget, RepositoryEntry } from "@/types/types"
import { RepositoryTableEntries } from "./RepositoryTable/RepositoryTableEntries";

export type RepositoryTableProps = {
    commit: RepositoryCommitTarget | undefined;
    entries: RepositoryEntry[] | undefined;
    submodules?: Record<string, string>
    provider: string
    defbranch: string
    currentPath: string
}

export function RepositoryTable({
    commit,
    entries,
    submodules,
    provider,
    defbranch,
    currentPath
}: RepositoryTableProps) {
    return (
        <div className="border rounded-md overflow-hidden">
            <RepositoryTableCommitInfo
                commit={commit}
                currentPath={currentPath}
            />
            <RepositoryTableEntries
                entries={entries}
                submodules={submodules}
                provider={provider}
                currentPath={currentPath}
                defbranch={defbranch}
            />
        </div>
    )
}
