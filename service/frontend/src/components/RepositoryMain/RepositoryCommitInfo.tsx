"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForkComparison } from "@/types/typesCommit";
import { OAuthRepository } from "@/types/typesRepository";
import Link from "next/link";


interface Props {
    forkContent: ForkComparison | undefined;
    currentPath: string;
    repository: OAuthRepository;
    parentOwner: string;
    parentRepo: string;
    parentBranch: string;
    branch: string;
}

export function RepositoryCommitInfo({
    forkContent,
    currentPath,
    repository,
    parentOwner,
    parentRepo,
    parentBranch,
    branch,
}: Props) {
    const isFork = repository?.data?.repository?.isFork;
    const parent = repository?.data?.repository?.parent;

    if (!isFork || !forkContent || !parent) return null;

    return (
        <div className="border rounded-md overflow-hidden px-4 py-2 flex items-center justify-between">
            <div className="truncate text-sm text-muted-foreground">
                {forkContent.status === "identical" ? (
                    <>
                        This branch is up to date with{" "}
                        <Badge variant="secondary">
                            {parent.nameWithOwner}:{parent.defaultBranchRef.name}
                        </Badge>.
                    </>
                ) : (
                    <>
                        This branch is{" "}
                        {forkContent.ahead_by > 0 && (
                            <Link
                                href={`${currentPath}/compare/${parentOwner}:${parentRepo}:${parentBranch}...${branch}`}
                                className="underline text-primary hover:opacity-80"
                            >
                                {forkContent.ahead_by} commit{forkContent.ahead_by > 1 ? "s" : ""} ahead of
                            </Link>
                        )}
                        {forkContent.ahead_by > 0 && forkContent.behind_by > 0 && ", "}
                        {forkContent.behind_by > 0 && (
                            <Link
                                href={`${currentPath}/compare/${branch}...${parentOwner}:${parentRepo}:${parentBranch}`}
                                className="underline text-primary hover:opacity-80"
                            >
                                {forkContent.behind_by} commit{forkContent.behind_by > 1 ? "s" : ""} behind
                            </Link>
                        )}{" "}
                        <Badge variant="secondary">
                            {parent.nameWithOwner}:{parent.defaultBranchRef.name}
                        </Badge>.
                    </>
                )}
            </div>

            {forkContent.status === "ahead" && (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Contribute</Button>
                    <Button variant="secondary" size="sm">Sync fork</Button>
                </div>
            )}
        </div>
    );
}
