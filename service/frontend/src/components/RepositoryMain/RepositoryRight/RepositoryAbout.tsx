import { Info } from "lucide-react"

export type RepositoryAboutProps = {
    description?: string | null
}

export function RepositoryAbout({ description }: RepositoryAboutProps) {
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
        </section>
    )
}
