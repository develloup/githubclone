import Link from "next/link"
import { ReactNode } from "react"
import { formatLicenseLabel } from "@/lib/format"
import { RepositoryLicenseInfo } from "@/types/typesRepository"
import { iconMap } from "../RepositoryTypes"

export type RepositoryDetectedFilesProps = {
    files: { category: string; filename: string }[];
    licenseInfo: RepositoryLicenseInfo | null;
    currentPath: string;
}


export function RepositoryDetectedFiles({
    files,
    licenseInfo,
    currentPath
}: RepositoryDetectedFilesProps) {
    if (!files || files.length === 0) return null

    return (
        <div className="space-y-2 pt-1 text-sm text-muted-foreground">
            {files.map(({ category, filename }) => {
                const tabKey = `${category}-ov-file`

                const label =
                    category === "license"
                        ? formatLicenseLabel(filename, licenseInfo?.name || licenseInfo?.key)
                        : filename

                const icon: ReactNode = iconMap[category as keyof typeof iconMap] ?? null

                return (
                    <Link
                        key={category}
                        href={`?tab=${tabKey}#${tabKey}`}
                        className="flex items-center gap-2 hover:underline"
                    >
                        {icon}
                        {label}
                    </Link>
                )
            })}
        </div>
    )
}
