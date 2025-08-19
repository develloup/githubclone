"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, usePathname } from "next/navigation";
import { DeleteIcon, EllipsisIcon } from "@/components/Icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRepositoryBranchLogic } from "@/hooks/branchData/useRepositoryBranchLogic";
import { RepositoryBranchNode } from "@/types/typesBranch";
import { formatRelativeTime } from "@/lib/format";

export default function BranchesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { provider, username, reponame } = useParams() as {
        provider: string;
        username: string;
        reponame: string;
    };

    const currentPath = usePathname();
    // const router = useRouter();

    const {
        branches
    } = useRepositoryBranchLogic({
        provider,
        username,
        reponame
    })

    console.log("Branches=", branches)
    const branchTable = branches?.yours?.data?.repository?.refs?.nodes ?? [];
    const yoursTable = branches?.yours?.data?.repository?.refs?.nodes ?? [];

    const basePath = currentPath.split("/").slice(0, -1).join("/");

    const tabs = [
        { label: "Overview", href: `${basePath}` },
        { label: "Yours", href: `${basePath}/yours`, condition: yoursTable?.length > 0 },
        { label: "Active", href: `${basePath}/active` },
        { label: "Stale", href: `${basePath}/stale` },
        { label: "All", href: `${basePath}/all` },
    ];


    return (
        <div className="max-w-[1340px] mx-auto px-4 py-6 space-y-6 mt-12">
            {/* Title + Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">Branches</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            New branch
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create new branch</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input placeholder="Branch name" />
                            {/* Optional: Checkbox oder Dropdown für Checkout */}
                        </div>
                        <DialogFooter>
                            <Button>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-wrap gap-2 text-sm border-b pb-2">
                {tabs
                    .filter(tab => tab.condition !== false) // filtere Tabs mit condition === false raus
                    .map(({ label, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="px-3 py-1 rounded-t bg-muted hover:bg-muted/70 font-medium"
                        >
                            {label}
                        </Link>
                    ))}
            </div>

            {/* Searchbox */}
            <Input
                placeholder="Search branches…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Active */}
            <section>
                <h2 className="text-sm font-semibold mt-6 mb-2">Your branches</h2>
                <BranchTable branches={branchTable} />
            </section>
        </div>
    );
}

function BranchTable({ branches }: { branches: RepositoryBranchNode[] }) {
    if (!branches || branches.length === 0) {
        return <p className="text-muted-foreground">No branches found.</p>;
    }

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
                <div key={idx} className="grid [grid-template-columns:50%_15%_11%_11%_9%_4%] px-3 py-2 border-b last:border-b-0 items-center text-xs    ">
                    <div>{branch.name}</div>
                    <div>{formatRelativeTime(branch.target.committedDate)}</div>
                    <div>{branch.target.checkSuites.nodes[0]?.status ?? ""}</div>
                    <div>behind 8</div>
                    <div>{branch.target.associatedPullRequests.totalCount}</div>
                    <div className="flex items-center justify-end gap-[2px]">
                        {/* Delete-Button */}
                        <Button variant="ghost" size="icon">
                            <DeleteIcon className="w-auto min-w-0" />
                        </Button>
                        {/* Menu with ellipsis */}
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
        </div>
    );
}