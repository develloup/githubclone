import { RepositoryTableCommitInfo } from "./RepositoryTable/RepositoryTableCommitInfo"
import { RepositoryCommitTarget, RepositoryEntry } from "@/types/typesRepository"
import { RepositoryTableEntries } from "./RepositoryTable/RepositoryTableEntries";

export type RepositoryTableProps = {
    commit: RepositoryCommitTarget | undefined;
    entries: RepositoryEntry[] | undefined;
    submodules?: Record<string, string>
    provider: string
    branch: string
    currentPath: string
}

export function RepositoryTable({
    commit,
    entries,
    submodules,
    provider,
    branch,
    currentPath
}: RepositoryTableProps) {
    return (
        <div className="border rounded-md overflow-hidden">
            <RepositoryTableCommitInfo
                commit={commit}
                currentPath={currentPath}
                branch={branch}
            />
            <RepositoryTableEntries
                entries={entries}
                submodules={submodules}
                provider={provider}
                currentPath={currentPath}
                branch={branch}
            />
        </div>
    )
}
