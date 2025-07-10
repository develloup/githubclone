import { ReactNode } from "react"
import { formatLicenseLabel } from "@/lib/format"
import { RepositoryLicenseInfo } from "@/types/typesRepository"
import { iconMap } from "@/components/RepositoryMain/RepositoryTypes"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

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
    const router = useRouter();
    if (!files || files.length === 0) return null

    return (
        <>
            {files.map(({ category, filename }) => {
                const tabKey = `${category}-ov-file`

                const label =
                    category === "license"
                        ? formatLicenseLabel(filename, licenseInfo?.name || licenseInfo?.key)
                        : filename

                const icon: ReactNode = iconMap[category as keyof typeof iconMap] ?? null

                return (
                    <Button
                        key={category}
                        variant="ghost"
                        onClick={() => {
                            router.replace(`?tab=${tabKey}#${tabKey}`, { scroll: false });
                        }}
                        className="px-0 py-0 h-auto text-muted-foreground hover:underline font-normal"
                    >
                        <span className="inline-flex items-center gap-2">
                            {icon}
                            {label}
                        </span>
                    </Button>
                )
            })}
        </>
    )
}
