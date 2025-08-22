"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TagIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { buildPathFromParent, getParentPath } from "@/lib/utils";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/Icons";
import { ReleaseTagSwitcher } from "@/components/ReleaseTagSwitcher";

type Asset = {
    name: string;
    date: string;
};

type Release = {
    id: string;
    date: string;
    author: string;
    avatarUrl: string;
    tagName: string;
    commitSha: string;
    isLatest: boolean;
    title: string;
    description: string;
    assets: Asset[];
    reactions?: string[];
};

const dummyReleases: Release[] = Array.from({ length: 10 }, (_, i) => ({
    id: `r${i}`,
    date: `2024-07-${i + 1}`,
    author: `dev${i}`,
    avatarUrl: "/avatars/user.png",
    tagName: `v1.0.${i}`,
    commitSha: "a1b2c3d",
    isLatest: i === 0,
    title: `Release ${i + 1}`,
    description: `This is the description for release ${i + 1}.`,
    assets: [
        { name: `asset-${i}-win.exe`, date: "2024-07-12" },
        { name: `asset-${i}-mac.dmg`, date: "2024-07-12" },
    ],
    reactions: ["👍", "🚀", "🎉"],
}));

export default function ReleasePage() {
    const currentPath = usePathname();
    const [searchTerm, setSearchTerm] = useState("");
    const basePath = getParentPath(currentPath);

    return (
        <div className="max-w-[1340px] mx-auto px-4 py-6 space-y-6 mt-12">
            {/* Header */}
            <div className="flex justify-between items-center">
                <ReleaseTagSwitcher basePath={basePath} active="releases" />
                <Input
                    placeholder="Find a release"
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Separator />

            {/* Releases */}
            {dummyReleases.map((release) => (
                <ReleaseCard key={release.id} release={release} />
            ))}

            {/* Pagination */}
            <div className="flex justify-center pt-6 text-sm gap-2 flex-wrap">
                <Button variant="ghost" size="sm">&lt; Previous</Button>
                {[1, 2, 3, 4, "...", 17, 18].map((item, idx) =>
                    typeof item === "number" ? (
                        <Button key={idx} variant="outline" size="sm">
                            {item}
                        </Button>
                    ) : (
                        <span key={idx} className="px-2 text-muted-foreground">
                            {item}
                        </span>
                    )
                )}
                <Button variant="ghost" size="sm">Next &gt;</Button>
            </div>
        </div>
    );
}

function ReleaseCard({ release }: { release: Release }) {
    const [showAssets, setShowAssets] = useState(false);

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Left: Meta */}
            <div className="col-span-2 space-y-2 text-sm text-muted-foreground">
                <div>{release.date}</div>
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={release.avatarUrl} alt={release.author} />
                        <AvatarFallback>{release.author[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{release.author}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                    <TagIcon className="w-4 h-4" />
                    {release.tagName}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                    {release.commitSha}
                </div>
                <Button variant="outline" size="sm">
                    Compare
                </Button>
            </div>

            {/* Right: Content */}
            <div className="col-span-10 space-y-4 border rounded-lg px-4 py-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{release.title}</h3>
                    {release.isLatest && <Badge variant="secondary">Latest</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{release.description}</p>

                <Separator className="w-full border-t border-muted" />

                {/* 📁 Toggleable Assets */}
                <div className="space-y-2">
                    <button
                        onClick={() => setShowAssets(!showAssets)}
                        className="flex items-center gap-2 font-semibold text-sm text-left"
                    >
                        {showAssets ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                        <span>Assets</span>
                        <Badge variant="outline">{release.assets.length}</Badge>
                    </button>

                    {showAssets && (
                        <div className="border rounded-md overflow-hidden text-sm">
                            {release.assets.map((asset, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between px-3 py-2 border-b last:border-b-0"
                                >
                                    <span>{asset.name}</span>
                                    <span className="text-muted-foreground">{asset.date}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reactions */}
                {release.reactions && release.reactions.length > 0 && (
                    <div className="pt-2 text-xl">
                        {release.reactions.map((emoji, idx) => (
                            <span key={idx} className="mr-2">
                                {emoji}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
