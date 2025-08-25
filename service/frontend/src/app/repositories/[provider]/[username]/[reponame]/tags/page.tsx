"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";

import { getParentPath } from "@/lib/utils";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { ReleaseTagSwitcher } from "@/components/ReleaseTagSwitcher";
import { useRepositoryTagLogic } from "@/hooks/tagData/useRepositoryTagLogic";
import { TagTable } from "@/components/TagTable";


export default function TagsPage() {
    const currentPath = usePathname(); // dynamisch ableitbar
    const basePath = getParentPath(currentPath);
    const { provider, username, reponame } = useParams() as {
        provider: string;
        username: string;
        reponame: string;
    };
    const searchParams = useSearchParams();
    const rawPage = searchParams.get("page") ?? "1";
    const parsedPage = parseInt(rawPage ?? "", 10);
    const page = isNaN(parsedPage) ? 1 : parsedPage;

    const {
        tags
    } = useRepositoryTagLogic({
        provider,
        username,
        reponame,
        page: page.toString()
    })

    const tagTable = tags?.data?.repository?.refs.nodes ?? [];
    const pageInfo = tags?.data?.repository?.refs?.pageInfo;

    return (
        <div className="max-w-[1340px] mx-auto px-4 py-6 space-y-6 mt-12">
            {/* Top menu */}
            <div className="flex justify-between items-center">
                <ReleaseTagSwitcher basePath={basePath} active="tags" />
            </div>
            <Separator />
            <section>
                <TagTable tags={tagTable} pageInfo={pageInfo} currentPage={page} currentPath={currentPath} owner={username} repository={reponame}/>
            </section>
        </div>
    );
}
