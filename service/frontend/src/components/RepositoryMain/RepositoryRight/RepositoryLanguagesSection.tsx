import { Badge } from "@/components/ui/badge"
import { RepositoryLanguages } from "@/types/typesRepository"

export type RepositoryLanguagesProps = {
    languages: RepositoryLanguages;
}

export function RepositoryLanguagesSection({ languages }: RepositoryLanguagesProps) {
    if (!languages || languages.totalSize === 0) return null

    return (
        <div className="space-y-2 text-sm">
            <h3 className="font-semibold flex items-center gap-2">
                Languages
                <Badge variant="secondary">{languages.edges.length}</Badge>
            </h3>

            <div
                className="w-full h-3 rounded overflow-hidden flex"
                role="progressbar"
                aria-label="language usage"
            >
                {languages.edges.map(({ node, size }) => {
                    const percent = (size / languages.totalSize) * 100
                    return (
                        <div
                            key={node.name}
                            title={`${node.name} – ${percent.toFixed(1)}%`}
                            style={{
                                width: `${percent}%`,
                                backgroundColor: node.color || "#ccc"
                            }}
                        />
                    )
                })}
            </div>
            <ul className="space-y-1 pl-1">
                {languages.edges.map(({ node, size }) => {
                    const total = languages.totalSize;
                    const percent = ((size / total) * 100).toFixed(1); // z. B. "12.4"
                    return (
                        <li key={node.name} className="flex items-center gap-2">
                            <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: node.color ?? "#ccc" }}
                            />
                            <span className="text-muted-foreground">
                                {node.name} ({percent}%)
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    )
}
