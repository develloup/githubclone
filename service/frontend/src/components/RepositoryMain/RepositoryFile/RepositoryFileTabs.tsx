import Link from "next/link"

import { formatLicenseLabel } from "@/lib/format"
import { BulletListIcon, PencilIcon } from "@/components/Icons"
import { iconMap } from "../RepositoryTypes"
import {FileDetectionWithKey } from "@/lib/detectStandardFiles"
import { RepositoryLicenseInfo } from "@/types/typesRepository"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export type RepositoryFileTabsProps = {
    tabList: FileDetectionWithKey[]
    activeTab: string
    licenseInfo: RepositoryLicenseInfo | null
    fileHref: string
}

export function RepositoryFileTabs({
    tabList,
    activeTab: initialTab,
    licenseInfo,
    fileHref
}: RepositoryFileTabsProps) {
    // console.log("RepositoryFileTabs")
    // console.log("tabList:     ", tabList);
    // console.log("activeTab:   ", activeTab);
    // console.log("licenseInfo: ", licenseInfo);
    // console.log("fileHref:    ", fileHref);
    const [activeTab, setActiveTab] = useState(initialTab ?? "readme-ov-file");
    const router = useRouter();
    return (
        <div className="flex justify-between items-center bg-muted px-4 py-2 border-b">
            <div className="flex gap-3 flex-wrap text-sm">
                {tabList.map(({ key, filename, category }) => {
                    const isActive = key === activeTab
                    const label = category === "license"
                        ? formatLicenseLabel(filename, licenseInfo?.name, licenseInfo?.key)
                        : filename

                    return (
                        <Button
                            key={key}
                            variant={isActive ? "default": "ghost"}
                            onClick={() => {
                                setActiveTab(key);
                                router.replace(`?tab=${key}#${key}`, { scroll: false });
                            }}
                            className={`px-2 py-1 border-b-2 ${isActive
                                ? "border-primary text-primary font-semibold"
                                : "border-transparent hover:underline"
                                }`}
                        >
                            <span className="inline-flex items-center gap-1">
                                {iconMap[category]}
                                {label}
                            </span>
                        </Button>
                    )
                })}
            </div>

            <div className="flex items-center gap-2">
                <Link href={fileHref}>
                    <PencilIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </Link>
                <div className="relative group">
                    <BulletListIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    <div className="hidden group-hover:block absolute right-0 mt-2 bg-popover border rounded shadow-md z-10 p-2 text-sm">
                        <button className="block w-full text-left px-2 py-1 hover:bg-accent">
                            Download as file
                        </button>
                        <button className="block w-full text-left px-2 py-1 hover:bg-accent">
                            Show as raw
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
