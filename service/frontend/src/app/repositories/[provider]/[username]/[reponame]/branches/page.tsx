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
import { PlusIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { DeleteIcon, EllipsisIcon } from "@/components/Icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type BranchInfo = {
    name: string;
    updated: string;
    checkStatus: string;
    behindAhead: string;
    pr: string | null;
};

const defaultBranches: BranchInfo[] = [
    {
        name: "main",
        updated: "2 hours ago",
        checkStatus: "✔️ Passed",
        behindAhead: "—",
        pr: "Open PR #42",
    },
];

const yourBranches: BranchInfo[] = [
    {
        name: "feature/login-ui",
        updated: "4 days ago",
        checkStatus: "⏳ Pending",
        behindAhead: "2 behind / 1 ahead",
        pr: null,
    },
    {
        name: "bugfix/missing-avatar",
        updated: "1 hour ago",
        checkStatus: "❌ Failed",
        behindAhead: "0 / 3",
        pr: "Draft PR #51",
    },
];

const activeBranches: BranchInfo[] = [
    {
        name: "refactor/auth-module",
        updated: "6 hours ago",
        checkStatus: "✔️ Passed",
        behindAhead: "1 / 5",
        pr: "Merged PR #39",
    },
    {
        name: "hotfix/server-error",
        updated: "1 day ago",
        checkStatus: "✔️ Passed",
        behindAhead: "—",
        pr: null,
    },
    {
        name: "chore/docs-cleanup",
        updated: "3 days ago",
        checkStatus: "⏳ Skipped",
        behindAhead: "0 / 0",
        pr: null,
    },
];

export default function BranchesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const currentPath = usePathname();

    return (
        <div className="max-w-[1340px] mx-auto px-4 py-6 space-y-6 mt-12">
            {/* 🏷️ Titel + Button */}
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

            {/* 🗂️ Tabs */}
            <div className="flex flex-wrap gap-2 text-sm border-b pb-2">
                {[
                    { label: "Overview", href: `${currentPath}` },
                    { label: "Yours", href: `${currentPath}/yours` },
                    { label: "Active", href: `${currentPath}/active` },
                    { label: "Stale", href: `${currentPath}/stale` },
                    { label: "All", href: `${currentPath}/all` },
                ].map(({ label, href }) => (
                    <Link
                        key={label}
                        href={href}
                        className="px-3 py-1 rounded-t bg-muted hover:bg-muted/70 font-medium"
                    >
                        {label}
                    </Link>
                ))}
            </div>

            {/* 🔎 Suchfeld */}
            <Input
                placeholder="Search branches…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* 📁 Default */}
            <section>
                <h2 className="text-sm font-semibold mt-4 mb-2">Default</h2>
                <BranchTable branches={defaultBranches} />
            </section>

            {/* 📁 Yours */}
            <section>
                <h2 className="text-sm font-semibold mt-6 mb-2">Your branches</h2>
                <BranchTable branches={yourBranches} />
            </section>

            {/* 📁 Active */}
            <section>
                <h2 className="text-sm font-semibold mt-6 mb-2">Active branches</h2>
                <BranchTable branches={activeBranches} />
            </section>
        </div>
    );
}

function BranchTable({ branches }: { branches: BranchInfo[] }) {
    if (!branches || branches.length === 0) {
        return <p className="text-muted-foreground">No branches found.</p>;
    }

    return (
        <div className="rounded-lg border overflow-hidden text-sm">
            {/* 🧠 Header */}
            <div className="grid [grid-template-columns:50%_15%_11%_11%_9%_4%] bg-muted text-muted-foreground px-3 py-2 text-xs font-semibold">
                <div>Branch</div>
                <div>Updated</div>
                <div>Check status</div>
                <div>Behind | Ahead</div>
                <div>Pull request</div>
                <div className="text-right"></div>
            </div>

            {/* 📦 Zeilen */}
            {branches.map((branch, idx) => (
                <div key={idx} className="grid [grid-template-columns:50%_15%_11%_11%_9%_4%] px-3 py-2 border-b last:border-b-0 items-center text-xs    ">
                    <div>{branch.name}</div>
                    <div>{branch.updated}</div>
                    <div>{branch.checkStatus}</div>
                    <div>{branch.behindAhead}</div>
                    <div>{branch.pr ?? "—"}</div>
                    <div className="flex items-center justify-end gap-[2px]">
                        {/* Delete-Button */}
                        <Button variant="ghost" size="icon">
                            <DeleteIcon className="w-auto min-w-0" />
                        </Button>

                        {/* Menü mit Ellipsis */}
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