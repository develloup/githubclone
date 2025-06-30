import Link from "next/link"
import { formatRelativeTime } from "@/lib/format"
import { RepositoryEntry } from "@/types/typesRepository"
import { FileIcon, FolderCommitIcon, FolderIcon } from "@/components/Icons";
import { getInternalPathFromExternalURL } from "@/lib/utils"
import { JSX } from "react/jsx-runtime";


function formatCommitMessageWithLinks(message: string, basePath: string): JSX.Element {
    const parts = message.split(/(#\d+)/g); // Erhalte Text und Matches getrennt

    return (
        <>
            {parts.map((part, index) => {
                const match = part.match(/^#(\d+)$/);
                if (match) {
                    const prNumber = match[1];
                    return (
                        <Link
                            key={index}
                            href={`${basePath}/pull/${prNumber}`}
                            className="text-primary underline hover:no-underline"
                        >
                            #{prNumber}
                        </Link>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
}

export function RepositoryTableEntries({
    entries,
    submodules,
    provider,
    defbranch,
    currentPath
}: {
    entries: RepositoryEntry[] | undefined;
    submodules?: Record<string, string>
    provider: string
    defbranch: string
    currentPath: string
}) {
    if (!entries || entries.length === 0) return null

    const sorted = [...entries].sort((a, b) => {
        const priority = (type: string) => type === "tree" || type === "commit" ? 0 : 1
        const priA = priority(a.type)
        const priB = priority(b.type)
        return priA !== priB ? priA - priB : a.name.localeCompare(b.name)
    })

    return (
        <>
            {sorted.map((entry, index) => {
                const isTree = entry.type === "tree"
                const isCommit = entry.type === "commit"
                const hasSubmodule = isCommit && submodules?.[entry.name]
                const submodulePath = hasSubmodule
                    ? getInternalPathFromExternalURL(
                        submodules[entry.name].replace(/\.git$/, "") + `/tree/${entry.oid}`,
                        provider
                    )
                    : null

                const href = `${currentPath}/${isTree || isCommit ? "tree" : "blob"}/${defbranch}/${encodeURIComponent(entry.name)}`
                const Icon = isCommit ? FolderCommitIcon : isTree ? FolderIcon : FileIcon
                const Wrapper = hasSubmodule ? "a" : Link
                const wrapperProps = hasSubmodule && submodulePath
                    ? { href: submodulePath }
                    : { href }

                return (
                    <Wrapper
                        key={index}
                        {...wrapperProps}
                        className="grid grid-cols-12 gap-2 p-2 text-sm hover:bg-accent cursor-pointer"
                    >
                        <div className="flex items-center col-span-4">
                            <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                            {isCommit ? `${entry.name} @ ${entry.oid.slice(0, 7)}` : entry.name}
                        </div>

                        <div className="text-muted-foreground col-span-6 whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatCommitMessageWithLinks(entry.message, currentPath)}
                        </div>

                        <div className="text-muted-foreground text-right col-span-2 whitespace-nowrap">
                            {formatRelativeTime(entry.committedDate)}
                        </div>
                    </Wrapper>
                )
            })}
        </>
    )
}
