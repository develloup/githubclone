import Link from "next/link"
import { getInternalRepositoryPath } from "@/lib/utils"

export type RepositoryForkOriginInfoProps = {
    parent: {
        nameWithOwner: string
        url: string
    }
    provider: string
    className?: string // optional für Layout-Anpassungen
}

export function RepositoryForkOriginInfo({
    parent,
    provider,
    className = "ml-14 text-sm text-muted-foreground"
}: RepositoryForkOriginInfoProps) {
    return (
        <div className={className}>
            Forked from{" "}
            <Link
                href={getInternalRepositoryPath(parent.url, "repositories", provider)}
                className="text-blue-600 hover:underline"
            >
                {parent.nameWithOwner}
            </Link>
        </div>
    )
}
