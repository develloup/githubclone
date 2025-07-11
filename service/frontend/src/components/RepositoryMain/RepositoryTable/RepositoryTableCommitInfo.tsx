
import { formatRelativeTime, formatWithCommas } from "@/lib/format"
import Link from "next/link";
import { RepositoryCommitTarget } from "@/types/typesRepository"
import { HistoryIcon } from "@/components/Icons";
import { formatCommitMessageWithLinks } from "@/lib/formatCommit";



export function RepositoryTableCommitInfo({
    commit,
    currentPath,
    branch
}: {
    commit: RepositoryCommitTarget | undefined
    currentPath: string
    branch: string
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
                {formatCommitMessageWithLinks(commit.messageHeadline, currentPath, commit.oid)}
            </div>
            <div className="hidden sm:block text-muted-foreground">
                {signatureValid ? "🔏 valid" : commit.signature ? "⚠️ invalid" : null}
            </div>
            <div className="text-xs text-muted-foreground">
                {getStatusSymbol(check?.status, check?.conclusion)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap text-xs font-mono">
                <Link
                    href={`${currentPath}/commits/${commit.oid}`}
                    className="text-primary hover:underline"
                >
                    {commit.oid.slice(0, 8)}
                </Link>
                <span>•</span>
                <span>{formatRelativeTime(commit.committedDate)}</span>
                <Link
                    href={`${currentPath}/commits/${branch}`}
                    className="flex items-center gap-1 text-gray-400 hover:text-primary hover:underline"
                >
                    <HistoryIcon className="w-4 h-4" />
                    {formatWithCommas(commit.history.totalCount)}
                </Link>
            </div>
        </div>
    )
}
