import Link from "next/link"
import { getInternalPathFromExternalURL } from "@/lib/utils"

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
                href={getInternalPathFromExternalURL(parent.url, provider)}
                className="text-blue-600 hover:underline"
            >
                {parent.nameWithOwner}
            </Link>
        </div>
    )
}
