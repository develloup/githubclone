"use client";

import { Separator } from "@/components/ui/separator";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { OAuthRepository, OAuthRepositoryBranchCommit, OAuthRepositoryContents, ProviderRepositoryFileContentsMap, RepositoryCollaborators } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toQualifiedRef } from "@/lib/extractRepoPath";
import { detectStandardFilesFromEntries, FileDetectionWithKey } from "@/lib/detectStandardFiles";
import { decodeBase64, parseGitmodules } from "@/lib/utils";
import { RepositoryHeader } from "@/components/RepositoryMain/RepositoryHeader";
import { RepositoryRight } from "@/components/RepositoryMain/RepositoryRight";
import { RepositoryTableHeader } from "@/components/RepositoryMain/RepositoryTableHeader";
import { RepositoryTable } from "@/components/RepositoryMain/RepositoryTable";
import { RepositoryFile } from "@/components/RepositoryMain/RepositoryFile";
import { Info } from "lucide-react";


type ProviderRepositoryMap = {
  [provider: string]: OAuthRepository;
};

type ProviderRepositoryContentMap = {
  [provider: string]: OAuthRepositoryContents;
};


export default function RepositoryPage() {
  const params = useParams();
  const currentPath = usePathname();
  const router = useRouter();

  const { provider, username, reponame } = params as {
    provider: string;
    username: string;
    reponame: string;
  };

  const [repository, setRepository] = useState<OAuthRepository | null>(null);
  const [repositorycontent, setRepositoryContent] = useState<OAuthRepositoryContents | null>(null);
  const [submodules, setSubmodules] = useState<Record<string, string>>({});
  const [hasCommitEntry, setHasCommitEntry] = useState(false);
  const [contributors, setContributors] = useState<RepositoryCollaborators | null>(null);
  const [branchcommits, setBranchCommits] = useState<OAuthRepositoryBranchCommit | null>(null);
  const [defbranch, setDefBranch] = useState<string | undefined>(undefined);
  const [loadingRepository, setLoadingRepository] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    setLoadingRepository(true);
    setLoadingContent(true);
    if (!provider || !username || !reponame) return;

    setError(null);

    fetchWithAuth(
      `/api/oauth/repository?provider=${provider}&owner=${username}&name=${reponame}`,
      { credentials: "include" }
    )
      .then(async (res) => {
        const responseText = await res.text();
        console.log("📦 Backend-Rohdaten (repository):", responseText);

        if (!res.ok)
          throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed: ProviderRepositoryMap = JSON.parse(responseText);
        const repo = parsed[provider];
        if (!repo)
          throw new Error(`Found no repository for provider ${provider}`);

        setRepository(repo);
        const db = repo.data.repository.defaultBranchRef.name;
        setDefBranch(db)
        console.log("The default branch: ", db);

        return {
          db,
          fetch: fetchWithAuth(
            `/api/oauth/repositorycontents?provider=${provider}&owner=${encodeURIComponent(
              username
            )}&name=${encodeURIComponent(reponame)}&expression=${encodeURIComponent(
              toQualifiedRef(db)
            )}`,
            { credentials: "include" }
          )
        };
      })
      .then(async ({ db, fetch }) => {
        const res = await fetch;
        const responseText = await res.text();
        console.log("📄 Backend-Rohdaten (content):", responseText);

        if (!res.ok)
          throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed: ProviderRepositoryContentMap = JSON.parse(responseText);
        const content = parsed[provider];
        if (!content)
          throw new Error(`Kein Repository-Inhalt für Provider ${provider} gefunden`);

        setRepositoryContent(content);

        return {
          db,
          fetch: fetchWithAuth(
            `/api/oauth/repositorycontributors?provider=${provider}&owner=${encodeURIComponent(username)}&name=${encodeURIComponent(reponame)}`,
            { credentials: "include" }
          )
        };
      })
      .then(async ({ db, fetch }) => {
        const res = await fetch;
        const responseText = await res.text();
        console.log("👥 Backend-Rohdaten (contributors):", responseText);

        if (!res.ok)
          throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed = JSON.parse(responseText);
        const contribs = parsed[provider];

        if (!contribs || !Array.isArray(contribs.nodes))
          throw new Error("Ungültige Contributor-Datenstruktur");

        setContributors(contribs);

        return fetchWithAuth(
          `/api/oauth/repositorybranchcommit?provider=${provider}&owner=${encodeURIComponent(username)}&name=${encodeURIComponent(reponame)}&expression=${encodeURIComponent(toQualifiedRef(db))}`,
          { credentials: "include" }
        );
      })
      .then(async (res) => {
        const responseText = await res.text();
        console.log("📌 Backend-Rohdaten (branchcommit):", responseText);

        if (!res.ok)
          throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed = JSON.parse(responseText);
        const branchcommits = parsed[provider];

        if (!branchcommits)
          throw new Error("Invalid Branch commit data structure");

        setBranchCommits(branchcommits);
      })
      .catch((err) => {
        console.error("❌ Fehler beim Laden:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoadingRepository(false);
        setLoadingContent(false);
      });
  }, [provider, username, reponame]);

  const detectedFiles = useMemo(() => {
    const entries = repositorycontent?.data?.repository?.object?.entries ?? []
    if (!entries || entries.length === 0) return []
    return detectStandardFilesFromEntries(entries)
  }, [repositorycontent])

  const entries = repositorycontent?.data?.repository?.object?.entries;

  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "readme-ov-file";

  const tabList: FileDetectionWithKey[] = detectedFiles.length > 0
  ? detectedFiles.map(({ category, filename }) => ({
      key: `${category}-ov-file`,
      label: filename,
      category,
      filename
    }))
  : [{
      key: "readme-ov-file",
      label: "README.md",
      category: "readme",
      filename: "README.md"
    }];

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

  useEffect(() => {
    const hasCommitEntry = entries?.some((e) => e.type === "commit");
    if (!hasCommitEntry || !defbranch) return;

    const fetchGitmodules = async () => {
      try {
        const url = new URL("/api/oauth/repositorycontent", window.location.origin);
        url.searchParams.set("provider", provider);
        url.searchParams.set("owner", username);
        url.searchParams.set("name", reponame);
        url.searchParams.set("content", ".gitmodules");
        url.searchParams.set("expression", defbranch);

        const res = await fetchWithAuth(url.toString());
        const responseText = await res.text();
        console.log("📦 Rohdaten vom Backend (.gitmodules):", responseText);

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${responseText}`);
        const parsed: ProviderRepositoryFileContentsMap = JSON.parse(responseText);
        const gitmodulesText = parsed[provider];
        const decoded = decodeBase64(gitmodulesText.content)

        const submodules = parseGitmodules(decoded);
        setSubmodules(submodules);
      } catch (err: unknown) {
        console.error("❌ Fehler beim Laden von .gitmodules:", err);
      }
    };

    fetchGitmodules();
  }, [entries, provider, username, reponame, defbranch]);


  if (loadingRepository || error || !repository || !defbranch)
    return (
      <div className="max-w-[1080px] mx-auto p-6 space-y-6 mt-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <div className="flex space-x-6">
          {/* Left Column */}
          <div className="w-[80%] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-3 bg-muted p-2 text-sm font-medium">
                <div>Dateiname</div>
                <div>Letzter Commit</div>
                <div>Letzte Änderung</div>
              </div>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-3 p-2 text-sm">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-[20%] space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>About</span>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );

  const activeFile = tabList.find((f) => `${f.category}-ov-file` === activeTab) ?? tabList[0];
  const fileHref = `${currentPath}/edit/${defbranch}/${encodeURIComponent(activeFile.filename)}`;

  return (
    <div className="max-w-[1080px] mx-auto p-6 space-y-6 mt-8">
      {/* Header */}
      <RepositoryHeader repository={repository.data.repository} provider={provider} />

      <Separator />

      {/* Main Content */}
      <div className="flex space-x-6">
        {/* Left Column */}
        <div className="w-[80%] space-y-4">
          <RepositoryTableHeader
            repository={repository.data.repository}
            currentPath={currentPath}
            onRefSelect={(type, name) => router.push(`/${type}/${encodeURIComponent(name)}`)}
          />

          {/* Table */}
          <RepositoryTable
            commit={
              branchcommits?.data?.repository?.ref?.target &&
              typeof branchcommits.data.repository.ref.target === "object" &&
              "oid" in branchcommits.data.repository.ref.target
                ? branchcommits.data.repository.ref.target
                : undefined
            }
            entries={entries}
            submodules={submodules}
            provider={provider}
            defbranch={repository.data.repository.defaultBranchRef.name}
            currentPath={currentPath}
          />

          <RepositoryFile
            tabList={tabList}
            activeTab={activeTab}
            activeFile={activeFile}
            fileHref={fileHref}
            licenseInfo={repository.data.repository.licenseInfo}
            provider="github"
            username={username}
            reponame={reponame}
            defbranch={repository.data.repository.defaultBranchRef.name}
          />
        </div>

        {/* Right Column */}
        <div className="w-[20%] space-y-4">
          <RepositoryRight repository={repository.data.repository} contributors={contributors} detectedFiles={detectedFiles} currentPath={currentPath} />
        </div>
      </div>
    </div>
  );
}
