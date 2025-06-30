import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/format"
import {RepositoryDeployments} from "@/types/typesRepository"

export type RepositoryDeploymentsProps = {
    deployments: RepositoryDeployments;
}

export function RepositoryDeploymentsSection({ deployments }: RepositoryDeploymentsProps) {
    if (!deployments || deployments.totalCount === 0) return null

    const latest = deployments.nodes[0]
    const restCount = deployments.totalCount - 1

    return (
        <div className="space-y-2 text-sm">
            <h3 className="font-semibold flex items-center gap-2">
                Deployments
                <Badge variant="secondary">{deployments.totalCount}</Badge>
            </h3>

            <div className="pl-1 space-y-1">
                <p className="flex items-center gap-2">
                    <span className="font-medium">{latest.environment}</span>
                    <span className="text-muted-foreground text-xs uppercase">{latest.state}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(latest.createdAt)}
                </p>
            </div>

            {restCount > 0 && (
                <Link
                    href="/deployments"
                    className="pl-1 block text-muted-foreground hover:underline"
                >
                    + {restCount} deployment{restCount > 1 ? "s" : ""}
                </Link>
            )}
        </div>
    )
}
