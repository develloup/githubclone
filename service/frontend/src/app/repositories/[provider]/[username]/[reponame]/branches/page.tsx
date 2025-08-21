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
import { useRepositoryBranchLogic } from "@/hooks/branchData/useRepositoryBranchLogic";
import { BranchTable } from "@/components/BranchTable";

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

    // console.log("Branches=", branches)
    const branchTable = branches?.active?.data?.repository?.refs?.nodes ?? [];
    const pageInfo = branches?.active?.data?.repository?.refs?.pageInfo;
    const yoursTable = branches?.yours?.data?.repository?.refs?.nodes ?? [];
    const defaultBranch = branches?.default?.data?.repository?.refs?.nodes ?? [];

    const tabs = [
        { label: "Overview", href: `${currentPath}` },
        { label: "Yours", href: `${currentPath}/yours`, disabled: !(yoursTable?.length > 0) },
        { label: "Active", href: `${currentPath}/active` },
        { label: "Stale", href: `${currentPath}/stale` },
        { label: "All", href: `${currentPath}/all` },
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
                {tabs.map(({ label, href, disabled }) => {
                    const isActive = currentPath === href;

                    return (
                        <Link
                            key={label}
                            href={href}
                            className={`px-3 py-1 rounded-t font-medium ${disabled
                                ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                                : isActive
                                    ? "bg-background border-b-2 border-primary text-primary"
                                    : "bg-muted hover:bg-muted/70"
                                }`}
                            aria-disabled={disabled}
                            tabIndex={disabled ? -1 : 0}
                            onClick={e => {
                                if (disabled) e.preventDefault();
                            }}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>

            {/* Searchbox */}
            <Input
                placeholder="Search branches…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Default */}
            <section>
                <h2 className="text-sm font-semibold mt-4 mb-2">Default</h2>
                <BranchTable branches={defaultBranch} />
            </section>

            {/* Yours */}
            {yoursTable.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold mt-6 mb-2">Your branches</h2>
                    <BranchTable branches={yoursTable} />
                </section>
            )}

            {/* Active */}
            <section>
                <h2 className="text-sm font-semibold mt-6 mb-2">Active branches</h2>
                <BranchTable branches={branchTable} moreBranchesLink={pageInfo?.hasNextPage ? `${currentPath}/all` : undefined} />
            </section>
        </div>
    );
}

