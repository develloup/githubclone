"use client";

import { useParams, useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { detectStandardFilesFromEntries, FileDetectionWithKey } from "@/lib/detectStandardFiles";
import { RepositoryHeader } from "@/components/RepositoryMain/RepositoryHeader";
import { RepositoryRight } from "@/components/RepositoryMain/RepositoryRight";
import { RepositoryTableHeader } from "@/components/RepositoryMain/RepositoryTableHeader";
import { RepositoryTable } from "@/components/RepositoryMain/RepositoryTable";
import { RepositoryFile } from "@/components/RepositoryMain/RepositoryFile";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RepositoryCommitInfo } from "@/components/RepositoryMain/RepositoryCommitInfo";
import { useRepositoryViewLogic } from "@/hooks/repositoryData/useRepositoryViewLogic";

export default function RepositoryPage() {
  const { provider, username, reponame } = useParams() as {
    provider: string;
    username: string;
    reponame: string;
  };

  const currentPath = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();


  const {
    repository,
    initialEntries,
    branch,
    loadingRepo,
    errorRepo,
    parentOwner,
    parentRepo,
    parentBranch,
    submodules,
    contributors,
    forkContent,
    branchCommits,
  } = useRepositoryViewLogic({
    provider,
    username,
    reponame
  });


  const activeTab = searchParams.get("tab") ?? "readme-ov-file";

  const detectedFiles = useMemo(() => {
    if (initialEntries.length === 0) return [];
    return detectStandardFilesFromEntries(initialEntries);
  }, [initialEntries]);

  const tabList: FileDetectionWithKey[] =
    detectedFiles.length > 0
      ? detectedFiles.map(({ category, filename }) => ({
        key: `${category}-ov-file`,
        label: filename,
        category,
        filename,
      }))
      : [
        {
          key: "readme-ov-file",
          label: "README.md",
          category: "readme",
          filename: "README.md",
        },
      ];

  const activeFile =
    tabList.find((f) => f.key === activeTab) ?? tabList[0];
  const fileHref = `${currentPath}/edit/${branch}/${encodeURIComponent(
    activeFile.filename
  )}`;

  useEffect(() => {
    const el = document.getElementById(activeTab);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    const threshold = 0.8; // mindestens 80 % sichtbar
    const elementHeight = rect.height;

    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibilityRatio = visibleHeight / elementHeight;

    if (visibilityRatio < threshold) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);


  if (loadingRepo || errorRepo || !repository || !branch) {
    return (
      <div className="max-w-[1280px] mx-auto p-6 space-y-6 mt-8">
        {/* Skeleton for header and table */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-[180px]" />
        </div>
        <Separator />
        <div className="flex space-x-6">
          <div className="w-[80%] space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="w-[20%] space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto p-6 space-y-6 mt-8">
      {/* Header */}
      <RepositoryHeader
        repository={repository.data.repository}
        provider={provider}
      />

      <Separator />

      <div className="flex space-x-6">
        {/* Left Column */}
        <div className="w-[75%] space-y-4">
          <RepositoryTableHeader
            repository={repository.data.repository}
            currentPath={currentPath}
            onRefSelect={(type, name) =>
              router.push(`/${type}/${encodeURIComponent(name)}`)
            }
          />
          <RepositoryCommitInfo
            forkContent={forkContent}
            currentPath={currentPath}
            repository={repository}
            parentOwner={parentOwner}
            parentRepo={parentRepo}
            parentBranch={parentBranch}
            branch={branch}
          />
          <RepositoryTable
            commit={
              branchCommits?.data?.repository?.ref?.target &&
                "oid" in branchCommits.data.repository.ref.target
                ? branchCommits.data.repository.ref.target
                : undefined
            }
            entries={initialEntries}
            submodules={submodules}
            provider={provider}
            defbranch={branch}
            currentPath={currentPath}
          />

          {Array.isArray(initialEntries) && initialEntries.length > 0 && (
            <RepositoryFile
              tabList={tabList}
              activeTab={activeTab}
              activeFile={activeFile}
              fileHref={fileHref}
              licenseInfo={repository.data.repository.licenseInfo}
              provider={provider}
              username={username}
              reponame={reponame}
              defbranch={branch}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="w-[25%] space-y-4">
          <RepositoryRight
            repository={repository.data.repository}
            contributors={contributors}
            detectedFiles={detectedFiles}
            currentPath={currentPath}
          />
        </div>
      </div>
    </div>
  );
}
