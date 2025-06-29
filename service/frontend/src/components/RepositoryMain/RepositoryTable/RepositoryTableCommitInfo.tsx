
import { formatRelativeTime, formatWithCommas } from "@/lib/format"
import { JSX } from "react/jsx-runtime";
import Link from "next/link";
import { RepositoryCommitTarget } from "@/types/types"
import { HistoryIcon } from "@/components/Icons";

function formatCommitMessageWithLinks(message: string, basePath: string): JSX.Element {
    const parts = message.split(/(#\d+)/g);

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


export function RepositoryTableCommitInfo({
    commit,
    currentPath
}: {
    commit: RepositoryCommitTarget | undefined
    currentPath: string
}) {
    if (!commit?.oid) return <div className="h-5 bg-muted p-2" />

    const author = commit.author?.user
    const signatureValid = commit.signature?.isValid
    const check = commit.checkSuites?.nodes?.[0]

    const getStatusSymbol = (status?: string, conclusion?: string) => {
        if (status && status !== "COMPLETED") return "•"
        if (conclusion === "FAILURE") return "❌"
        if (conclusion === "SUCCESS") return "✔️"
        return ""
    }

    return (
        <div className="flex items-center justify-between bg-muted p-2 text-sm font-medium space-x-4 overflow-hidden">
            <div className="flex items-center space-x-2 min-w-0">
                {author?.avatarUrl && (
                    <img
                        src={author.avatarUrl}
                        alt={author.login}
                        className="w-6 h-6 rounded-full"
                    />
                )}
                <span className="truncate text-muted-foreground font-mono">
                    {author?.login || commit.author.name}
                </span>
            </div>
            <div className="flex-1 truncate" title={commit.messageHeadline}>
                {formatCommitMessageWithLinks(commit.messageHeadline, currentPath)}
            </div>
            <div className="hidden sm:block text-muted-foreground">
                {signatureValid ? "🔏 valid" : commit.signature ? "⚠️ invalid" : null}
            </div>
            <div className="text-xs text-muted-foreground">
                {getStatusSymbol(check?.status, check?.conclusion)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap text-xs font-mono">
                <span className="text-primary-600">{commit.oid.slice(0, 8)}</span>
                <span>•</span>
                <span>{formatRelativeTime(commit.committedDate)}</span>
                <span className="flex items-center gap-1 text-gray-400">
                    <HistoryIcon className="w-4 h-4" />
                    {formatWithCommas(commit.history.totalCount)}
                </span>
            </div>
        </div>
    )
}
