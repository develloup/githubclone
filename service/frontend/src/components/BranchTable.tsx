import { formatRelativeTime } from "@/lib/format";
import { RepositoryBranchNode } from "@/types/typesBranch";
import { PageInfoNext } from "@/types/typesPageInfo";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { DeleteIcon, EllipsisIcon } from "./Icons";
import Link from "next/link";

type BranchTableProps = {
    branches: RepositoryBranchNode[];
    moreBranchesLink?: string;
    pageInfo?: PageInfoNext;
    currentPage?: number;
    currentPath?: string;
};

export function BranchTable({
    branches,
    moreBranchesLink,
    pageInfo,
    currentPage = 1,
    currentPath = "",
}: BranchTableProps) {
    if (!branches || branches.length === 0) {
        return <p className="text-muted-foreground">No branches found.</p>;
    }
    // console.log("branches=          ", branches)
    // console.log("moreBranchesLinks= ", moreBranchesLink)
    // console.log("pageinfo=          ", pageInfo)
    // console.log("currentPage=       ", currentPage)
    // console.log("currentPath=       ", currentPath)

    return (
        <div className="rounded-lg border overflow-hidden text-sm">
            {/* Header */}
            <div className="grid [grid-template-columns:50%_15%_11%_11%_9%_4%] bg-muted text-muted-foreground px-3 py-2 text-xs font-semibold">
                <div>Branch</div>
                <div>Updated</div>
                <div>Check status</div>
                <div>Behind | Ahead</div>
                <div>Pull request</div>
                <div className="text-right"></div>
            </div>

            {/* Rows */}
            {branches.map((branch, idx) => (
                <div key={idx} className="grid [grid-template-columns:50%_15%_11%_11%_9%_4%] px-3 py-2 border-b last:border-b-0 items-center text-xs">
                    <div>{branch.name}</div>
                    <div>{formatRelativeTime(branch.target.committedDate)}</div>
                    <div>{branch.target.checkSuites.nodes[0]?.status ?? ""}</div>
                    <div>behind 8</div>
                    <div>{branch.target.associatedPullRequests.totalCount}</div>
                    <div className="flex items-center justify-end gap-[2px]">
                        <Button variant="ghost" size="icon">
                            <DeleteIcon className="w-auto min-w-0" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <EllipsisIcon className="w-auto min-w-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>New pull request</DropdownMenuItem>
                                <DropdownMenuItem>New activity</DropdownMenuItem>
                                <DropdownMenuItem>View rules</DropdownMenuItem>
                                <DropdownMenuItem>Rename branch</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ))}

            {/* Optional: View more branches link */}
            {moreBranchesLink && (
                <div className="px-3 py-2 text-xs text-right">
                    <Link href={moreBranchesLink} className="text-primary hover:underline">
                        View more branches &gt;
                    </Link>
                </div>
            )}

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
