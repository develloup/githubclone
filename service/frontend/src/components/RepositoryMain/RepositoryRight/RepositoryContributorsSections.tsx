import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { RepositoryCollaborators } from "@/types/typesRepository"
export type Contributor = {
    login: string
    avatarUrl: string
    htmlUrl: string
}

export type RepositoryContributorsProps = {
    contributors: RepositoryCollaborators | undefined;
}

export function RepositoryContributorsSection({ contributors }: RepositoryContributorsProps) {
    if (!contributors || !Array.isArray(contributors.nodes) || contributors.nodes.length === 0) return null

    const visibleContributors = contributors.nodes.slice(0, 14)
    const remaining = contributors.totalCount - visibleContributors.length

    return (
        <div className="space-y-2 text-sm">
            <h3 className="font-semibold flex items-center gap-2">
                Contributors
                <Badge variant="secondary">{contributors.totalCount}</Badge>
            </h3>

            <div className="flex flex-wrap gap-2">
                {visibleContributors.map(user => (
                    <Link
                        key={user.login}
                        href={user.htmlUrl}
                        className="inline-block"
                        title={user.login}
                    >
                        <img
                            src={user.avatarUrl}
                            alt={`Avatar of ${user.login}`}
                            className="w-8 h-8 rounded-full ring-1 ring-muted"
                        />
                    </Link>
                ))}
            </div>

            {remaining > 0 && (
                <Link
                    href="/contributors"
                    className="block text-sm text-muted-foreground hover:underline pl-1"
                >
                    + {remaining} {remaining === 1 ? "contributor" : "contributors"}
                </Link>
            )}
        </div>
    )
}
