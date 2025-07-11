"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TagIcon, FileArchive } from "lucide-react";
import { buildPathFromParent, getParentPath } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ReleaseTagSwitcher } from "@/components/ReleaseTagSwitcher";

const tags = Array.from({ length: 10 }, (_, i) => ({
    name: `v1.0.${i}`,
    date: `2024-07-${i + 1}`,
    sha: "a1b2c3d",
    verified: true,
    assets: ["zip", "tar.gz"],
}));

export default function TagsPage() {
    const currentPath = usePathname(); // dynamisch ableitbar
    const [page, setPage] = useState(1);
    const basePath = getParentPath(currentPath);

    // console.log("currentPath: ", currentPath);

    return (
        <div className="max-w-[1160px] mx-auto px-4 py-6 space-y-6 mt-12">
            {/* 🔝 Top-Leiste */}
            <div className="flex justify-between items-center">
                <ReleaseTagSwitcher basePath={basePath} active="tags" />
            </div>

            <Separator />

            <div className="rounded-lg border overflow-hidden bg-background text-sm">
                {/* 🔖 Table Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted text-muted-foreground font-medium">
                    <TagIcon className="w-4 h-4" />
                    <span>Tags</span>
                </div>

                {/* 🔁 Table Rows */}
                {tags.map((tag) => (
                    <div
                        key={tag.name}
                        className="border-b last:border-b-0  bg-background p-4 space-y-4 text-sm"
                    >
                        {/* 🔖 Tag-Header mit Name & Verified */}
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-base">{tag.name}</span>
                            {tag.verified && (
                                <Badge variant="secondary" className="whitespace-nowrap">Verified</Badge>
                            )}
                        </div>

                        {/* 📃 Meta & Actions in einer Zeile */}
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
                            <span>{tag.date}</span>
                            <span className="font-mono text-xs">{tag.sha}</span>

                            {/* 📦 Asset-Buttons */}
                            <div className="flex gap-2">
                                {tag.assets.map((asset) => (
                                    <Button key={asset} variant="outline" size="sm" className="h-7 px-2">
                                        <FileArchive className="w-4 h-4 mr-1" />
                                        {asset}
                                    </Button>
                                ))}
                            </div>

                            {/* 🔗 Notes-Button */}
                            <Link href={`${buildPathFromParent(currentPath, `tag/${tag.name}`)}`}>
                                <Button variant="default" size="sm" className="h-7 px-3">Notes</Button>
                            </Link>
                        </div>
                    </div>
                ))}


            </div>

            {/* 🔽 Paginierung */}
            <div className="flex justify-center pt-4 gap-4 text-sm">
                <Button variant="ghost" size="sm" disabled={page === 1}>
                    &lt; Previous
                </Button>
                <Button variant="ghost" size="sm" disabled={page >= 5}>
                    Next &gt;
                </Button>
            </div>
        </div>
    );
}
