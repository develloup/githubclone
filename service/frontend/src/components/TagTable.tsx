import { PageInfoNext } from "@/types/typesPageInfo";
import { RepositoryTagNode } from "@/types/typesTag";
import { CommitIcon, TagIcon } from "./Icons";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { buildPathFromParent } from "@/lib/utils";

type TagTableProps = {
    tags: RepositoryTagNode[];
    pageInfo?: PageInfoNext;
    currentPage?: number;
    currentPath?: string;
    owner?: string;
    repository?: string;
};

export function TagTable({
    tags,
    pageInfo,
    currentPage = 1,
    currentPath = "",
    owner = "",
    repository = ""
}: TagTableProps) {
    if (!tags || tags.length === 0) {
        return <p className="text-muted-foreground">No tags found.</p>;
    }
    // console.log("tags=          ", tags)
    // console.log("pageinfo=      ", pageInfo)
    // console.log("currentPage=   ", currentPage)
    // console.log("currentPath=   ", currentPath)

    //     {/* Asset-Buttons */}
    // <div className="flex gap-2">
    //     {tag.assets.map((asset) => (
    //         <Button key={asset} variant="outline" size="sm" className="h-7 px-2">
    //             <FileArchive className="w-4 h-4 mr-1" />
    //             {asset}
    //         </Button>
    //     ))}
    // </div>

    return (
        <div className="rounded-lg border overflow-hidden bg-background text-sm">
            {/* Table Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted text-muted-foreground font-medium">
                <TagIcon className="w-4 h-4" />
                <span>Tags</span>
            </div>

            {/* Table Rows */}
            {tags.map((tag) => (
                <div
                    key={tag.name}
                    className="border-b last:border-b-0  bg-background p-4 space-y-4 text-sm"
                >
                    {/* Tag-Header with name & verified */}
                    <div className="flex justify-between items-center">
                        <Link
                            href={`${buildPathFromParent(currentPath, `releases/tag/${tag.name}`)}`}
                            className="font-medium text-base text-primary hover:underline"
                        >
                            {tag.name}
                        </Link>

                        {tag.name && (
                            <Badge variant="secondary" className="whitespace-nowrap">Verified</Badge>
                        )}
                    </div>
                    {/* Meta & Actions in one line */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
                        <span>{tag.target.committedDate}</span>
                        <Link
                            href={`${buildPathFromParent(currentPath, `commit/${tag.target.committedHash}`)}`}
                            className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
                        >
                            <CommitIcon className="w-4 h-4" />
                            <span>{tag.target.committedHash}</span>
                        </Link>
                        {/* Notes-Button */}
                        <Link href={`${buildPathFromParent(currentPath, `releases/tag/${tag.name}`)}`}>
                            <Button variant="default" size="sm" className="h-7 px-3">Notes</Button>
                        </Link>
                    </div>
                </div>
            ))}

            {/* Optional: Pagination buttons */}
            {(pageInfo?.hasPreviousPage || pageInfo?.hasNextPage) && (
                <div className="flex justify-center gap-4 py-4">
                    <Link
                        href={
                            pageInfo.hasPreviousPage && currentPage > 1
                                ? `${currentPath}?page=${currentPage - 1}`
                                : "#"
                        }
                        className={`text-sm px-4 py-2 border rounded ${pageInfo.hasPreviousPage && currentPage > 1
                            ? "hover:bg-muted"
                            : "opacity-50 cursor-not-allowed pointer-events-none"
                            }`}
                    >
                        &lt; Previous
                    </Link>

                    <Link
                        href={
                            pageInfo.hasNextPage
                                ? `${currentPath}?page=${currentPage + 1}`
                                : "#"
                        }
                        className={`text-sm px-4 py-2 border rounded ${pageInfo.hasNextPage
                            ? "hover:bg-muted"
                            : "opacity-50 cursor-not-allowed pointer-events-none"
                            }`}
                    >
                        Next &gt;
                    </Link>
                </div>
            )}
        </div>
    );
}