import LinkIcon from "@/components/Icons"
import { Info } from "lucide-react"

export type RepositoryAboutProps = {
    description?: string | null,
    homepageUrl: string
}

export function RepositoryAbout({ description, homepageUrl }: RepositoryAboutProps) {
    return (
        <section className="space-y-1">
            <div className="flex justify-between items-center text-sm font-medium">
                <span>About</span>
                <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground leading-snug">
                {description?.trim()
                    ? description
                    : "No description, website, or topics provided."}
            </p>
            {homepageUrl ? (
                <a
                href={homepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex text-xs items-center gap-1 text-muted-foreground hover:text-foreground transition-colors}`}
                >
                <LinkIcon className="w-4 h-4" />
                <span>{homepageUrl.replace(/https?:\/\//, "").replace(/\/$/, "")}</span>
                </a>
            ) : null}
        </section>
    )
}
