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
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useRepositoryBranchLogic } from "@/hooks/branchData/useRepositoryBranchLogic";
import { BranchTable } from "@/components/BranchTable";

export default function BranchesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { provider, username, reponame } = useParams() as {
        provider: string;
        username: string;
        reponame: string;
    };
    const searchParams = useSearchParams();
    const rawPage = searchParams.get("page") ?? "1";
    const parsedPage = parseInt(rawPage ?? "", 10);
    const page = isNaN(parsedPage) ? 1 : parsedPage;

    const currentPath = usePathname();
    // const router = useRouter();

    const {
        branches
    } = useRepositoryBranchLogic({
        provider,
        username,
        reponame,
        tab: '4',
        page: page.toString()
    })

    console.log("Branches=", branches)
    const branchTable = branches?.yours?.data?.repository?.refs?.nodes ?? [];
    const pageInfo = branches?.yours?.data?.repository?.refs?.pageInfo;
    const yoursTable = branches?.yours?.data?.repository?.refs?.nodes ?? [];

    const basePath = currentPath.split("/").slice(0, -1).join("/");

    const tabs = [
        { label: "Overview", href: `${basePath}` },
        { label: "Yours", href: `${basePath}/yours`, disabled: !(yoursTable?.length > 0) },
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

            {/* Active */}
            <section>
                <h2 className="text-sm font-semibold mt-6 mb-2">Your branches</h2>
                <BranchTable branches={branchTable} pageInfo={pageInfo} currentPage={page} currentPath={currentPath}/>
            </section>
        </div>
    );
}
