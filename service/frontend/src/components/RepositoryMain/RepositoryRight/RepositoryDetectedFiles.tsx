import Link from "next/link"
import { ReactNode } from "react"
import { formatLicenseLabel } from "@/lib/format"
import { CodeOfConductIcon, ContributingIcon, LicenseIcon, ReadmeIcon, SecurityIcon } from "@/components/Icons"
import { RepositoryLicenseInfo } from "@/types/types"

export type RepositoryDetectedFilesProps = {
    files: { category: string; filename: string }[];
    licenseInfo: RepositoryLicenseInfo | null;
    currentPath: string;
}

const iconMap = {
    readme: <ReadmeIcon className="w-4 h-4 text-muted-foreground" />,
    license: <LicenseIcon className="w-4 h-4 text-muted-foreground" />,
    security: <SecurityIcon className="w-4 h-4 text-muted-foreground" />,
    code_of_conduct: <CodeOfConductIcon className="w-4 h-4 text-muted-foreground" />,
    contributing: <ContributingIcon className="w-4 h-4 text-muted-foreground" />,
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
