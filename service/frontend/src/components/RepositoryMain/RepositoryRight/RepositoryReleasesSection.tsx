import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { RepositoryReleases } from "@/types/typesRepository"
import { TagIcon } from "@/components/Icons";
import { formatRelativeTime } from "@/lib/format";


export type RepositoryReleasesProps = {
    releases: RepositoryReleases;
    currentPath: string
}

export function RepositoryReleasesSection({ releases, currentPath }: RepositoryReleasesProps) {
    if (!releases) return null

    const latest = releases.nodes[0]

    return (
        <div className="space-y-2 text-sm">
            <h3 className="font-semibold flex items-center gap-2">
                Releases
                {releases.totalCount > 0 && (
                    <Badge variant="secondary">{releases.totalCount}</Badge>
                )}
            </h3>

            {releases.totalCount === 0 ? (
                <>
                    <p className="text-muted-foreground">No releases published</p>
                    <Link
                        href={`${currentPath}/releases/new`}
                        className="text-primary hover:underline"
                    >
                        Publish a new release
                    </Link>
                </>
            ) : (
                <>
                    <Link
                        href={`${currentPath}/releases/${latest.tagName}`}
                        className="flex items-center gap-2 hover:underline text-primary"
                    >
                        <TagIcon className="w-4 h-4" />
                        {latest.name ?? latest.tagName}
                        {(latest.isDraft || latest.isLatest) && (
                            <Badge variant="outline">
                                {latest.isDraft ? "Draft" : "Latest"}
                            </Badge>
                        )}
                    </Link>
                    <p className="text-xs text-muted-foreground pl-6">
                        {formatRelativeTime(latest.createdAt)}
                    </p>
                    {releases.totalCount > 1 && (
                        <Link
                            href={`${currentPath}/releases`}
                            className="pl-6 block text-muted-foreground hover:underline"
                        >
                            + {releases.totalCount - 1} release
                            {releases.totalCount - 1 > 1 ? "s" : ""}
                        </Link>
                    )}
                </>
            )}
        </div>
    )
}
