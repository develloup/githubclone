"use client";

import { useParams, useSearchParams, usePathname, useRouter, notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { detectStandardFilesFromEntries, FileDetectionWithKey } from "@/lib/detectStandardFiles";
import { decodeBase64, findFirstIncompleteEntryName, mergeCommitMetaIntoEntriesMutating, parseGitmodules } from "@/lib/utils";
import { RepositoryHeader } from "@/components/RepositoryMain/RepositoryHeader";
import { RepositoryRight } from "@/components/RepositoryMain/RepositoryRight";
import { RepositoryTableHeader } from "@/components/RepositoryMain/RepositoryTableHeader";
import { RepositoryTable } from "@/components/RepositoryMain/RepositoryTable";
import { RepositoryFile } from "@/components/RepositoryMain/RepositoryFile";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRepository } from "@/hooks/repositoryData/useRepository";
import { useRepositoryContents } from "@/hooks/repositoryData/useRepositoryContent";
import { useContributors } from "@/hooks/repositoryData/useContributors";
import { useBranchCommits } from "@/hooks/repositoryData/useBranchCommits";
import { useGitmodules } from "@/hooks/repositoryData/useGitmodules";
import { useRepositoryContentsPartial } from '@/hooks/repositoryData/useRepositoryContent';
import { RepositoryEntry } from "@/types/typesRepository";


function useRepositoryCommitLoader(
  provider: string,
  username: string,
  reponame: string,
  branch: string,
  initialEntries: RepositoryEntry[],
  chunkSize: number = 40
) {
  const [entries, setEntries] = useState(initialEntries)
  const [startname, setStartname] = useState<string | undefined | null>()

  console.log("startname: ", startname);

  useEffect(() => {
    if (!initialEntries || initialEntries.length === 0) return

    setEntries(initialEntries)

    const startname = findFirstIncompleteEntryName(initialEntries)
    console.log("Initial startname set to:", startname)
    setStartname(startname)
  }, [initialEntries])

  const { data, isFetching } = useRepositoryContentsPartial(
    provider,
    username,
    reponame,
    branch,
    startname,
    chunkSize
  )

  console.log("data: ", data);

  useEffect(() => {
    console.log("1data:  ", data);
    console.log("1start: ", startname);
    if (!data || !startname) return

    const enriched = data.data.repository?.object?.entries ?? []

    // Patch commit info into current entries
    mergeCommitMetaIntoEntriesMutating(entries, enriched)

    // Trigger re-render
    setEntries([...entries])

    // Recalculate missing commit info
    const nextStart = findFirstIncompleteEntryName(entries)
    console.log("next incomplete entry: ", nextStart);
    setStartname(nextStart)
  }, [data, entries, startname])

  return {
    entries,
    isLoading: isFetching,
    hasIncomplete: !!startname
  }
}

export default function RepositoryPage() {
  const { provider, username, reponame } = useParams() as {
    provider: string;
    username: string;
    reponame: string;
  };

  const currentPath = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "readme-ov-file";

  const { data: repository, isLoading: loadingRepo, error: errorRepo } =
    useRepository(provider, username, reponame);

  const branch = repository?.data.repository.defaultBranchRef.name;

  const {
    data: repositoryContent,
    isLoading: loadingContent,
    error: errorContent,
  } = useRepositoryContents(provider, username, reponame, branch);
                
  const {
    data: contributors,
    isLoading: loadingContributors,
  } = useContributors(provider, username, reponame, !!branch);

  const {
    data: branchCommits,
    isLoading: loadingCommits,
  } = useBranchCommits(provider, username, reponame, branch);

  const hasGitmodules = repositoryContent?.data?.repository?.object?.entries?.some(
    (e) => e.name === ".gitmodules"
  );

  const { data: gitmodulesRaw } = useGitmodules(
    provider,
    username,
    reponame,
    branch,
    hasGitmodules
  );

  const submodules = useMemo(() => {
    // console.log("gitmodulesRaw: ", gitmodulesRaw);
    if (!gitmodulesRaw) return {};
    try {
      const decoded = decodeBase64(gitmodulesRaw);
      return parseGitmodules(decoded);
    } catch (err) {
      console.warn("Error during parsing of .gitmodules:", err);
      return {};
    }
  }, [gitmodulesRaw]);

  const initialEntries = useMemo(() => {
    return repositoryContent?.data?.repository?.object?.entries ?? [];
  }, [repositoryContent]);

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
    const isVisible =
      rect.top >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);

    if (!isVisible) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);


  const {
    entries,
    isLoading: isEnriching,
    hasIncomplete
  } = useRepositoryCommitLoader(
    provider,
    username,
    reponame,
    branch!,
    initialEntries,
    40
  )

  if (loadingRepo || errorRepo || !repository || !branch) {
    return (
      <div className="max-w-[1080px] mx-auto p-6 space-y-6 mt-8">
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
    <div className="max-w-[1080px] mx-auto p-6 space-y-6 mt-8">
      {/* Header */}
      <RepositoryHeader
        repository={repository.data.repository}
        provider={provider}
      />

      <Separator />

      <div className="flex space-x-6">
        {/* Left Column */}
        <div className="w-[80%] space-y-4">
          <RepositoryTableHeader
            repository={repository.data.repository}
            currentPath={currentPath}
            onRefSelect={(type, name) =>
              router.push(`/${type}/${encodeURIComponent(name)}`)
            }
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
        <div className="w-[20%] space-y-4">
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
