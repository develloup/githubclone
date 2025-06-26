"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { GitBranch, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { OAuthRepository, OAuthRepositoryBranchCommit, OAuthRepositoryContents, RepositoryCollaboratorNode } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toQualifiedRef, formatNumber } from "@/lib/extractRepoPath";
import {
  ActivityIcon,
  BulletListIcon,
  CodeOfConductIcon,
  ContributingIcon,
  EyeIcon,
  FileIcon,
  FolderIcon,
  ForkIcon,
  HistoryIcon,
  LicenseIcon,
  PencilIcon,
  ReadmeIcon,
  SecurityIcon,
  StarIcon,
  TagIcon,
} from "@/components/Icons";
import Link from "next/link";
import { BranchTagSelector } from "@/components/BranchTagSelector";
import { formatLicenseLabel, formatRelativeTime, formatWithCommas } from '../../../../../lib/format';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { detectStandardFilesFromEntries } from "@/lib/detectStandardFiles";
import { JSX } from "react/jsx-runtime";
import { MarkdownViewer } from "@/components/markdownviewer";
import { getInternalRepositoryPath } from "@/lib/utils";

// Optional: import "highlight.js/styles/github.css"; // Style z.B. GitHub-Style

type ProviderRepositoryMap = {
  [provider: string]: OAuthRepository;
};

type ProviderRepositoryContentMap = {
  [provider: string]: OAuthRepositoryContents;
};

function formatCommitMessageWithLinks(message: string, basePath: string): JSX.Element {
  const parts = message.split(/(#\d+)/g); // Erhalte Text und Matches getrennt

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^#(\d+)$/);
        if (match) {
          const prNumber = match[1];
          return (
            <Link
              key={index}
              href={`${basePath}/pull/${prNumber}`}
              className="text-primary underline hover:no-underline"
            >
              #{prNumber}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}


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
  const [repositorycontent, setRepositoryContent] =
    useState<OAuthRepositoryContents | null>(null);
  const [contributors, setContributors] = useState<RepositoryCollaboratorNode[] | null>(null);
  const [totalContributors, setTotalContributors] = useState<number>(0);
  const [branchcommits, setBranchCommits] = useState<OAuthRepositoryBranchCommit | null>(null);
  const [defbranch, setDefBranch] = useState<string | undefined>(undefined);
  const [loadingRepository, setLoadingRepository] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const iconMap = {
    readme: <ReadmeIcon className="w-4 h-4 text-muted-foreground" />,
    license: <LicenseIcon className="w-4 h-4 text-muted-foreground" />,
    security: <SecurityIcon className="w-4 h-4 text-muted-foreground" />,
    code_of_conduct: <CodeOfConductIcon className="w-4 h-4 text-muted-foreground" />,
    contributing: <ContributingIcon className="w-4 h-4 text-muted-foreground" />,
  }

  const statBadge = (count: number) => (
    <span className="ml-1 px-2 rounded-full bg-muted text-xs font-mono text-muted-foreground">
      {count.toLocaleString()}
    </span>
  )


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

        setContributors(contribs.nodes);
        setTotalContributors(contribs.totalCount);

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

  const tabList = detectedFiles.length > 0
    ? detectedFiles.map(({ category, filename }) => ({
        key: `${category}-ov-file`,
        label: filename, // oder category.toUpperCase()
        category,
        filename
      }))
    : [{
        key: "readme-ov-file",
        label: "README.md",
        category: "readme",
        filename: "README.md"
      }]

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
  // const fileExt = activeFile.filename.toLowerCase().split(".").pop();
  const fileHref = `${currentPath}/edit/${defbranch}/${encodeURIComponent(activeFile.filename)}`;

  type IconCategory = "readme" | "license" | "security" | "code_of_conduct" | "contributing";


  return (
    <div className="max-w-[1080px] mx-auto p-6 space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={repository.data.repository.owner.avatarUrl}
            className="h-10 w-10 rounded-full"
            alt="Owner Avatar"
          />
          <h1 className="text-2xl font-bold">
            {repository.data.repository.name}
          </h1>
          <Badge variant="outline" className="text-xs rounded-full">
            {repository.data.repository.isArchived
              ? repository.data.repository.isPrivate
                ? "Private archive"
                : "Public archive"
              : repository.data.repository.isPrivate
                ? "Private"
                : "Public"}
          </Badge>
        </div>
        <div className="flex space-x-2">
          {/* Watch */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <EyeIcon className="w-4 h-4 mr-1" />
                Watch {statBadge(repository.data.repository.watchers.totalCount)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Not Watching</DropdownMenuItem>
              <DropdownMenuItem>Watching</DropdownMenuItem>
              <DropdownMenuItem>Custom Notification…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fork */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <ForkIcon className="w-4 h-4 mr-1" />
                Fork {statBadge(repository.data.repository.forkCount)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Fork this repo</DropdownMenuItem>
              <DropdownMenuItem>Compare with fork</DropdownMenuItem>
              <DropdownMenuItem>Open forks</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Star */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <StarIcon className="w-4 h-4 mr-1 fill-current text-yellow-500" />
                Star {statBadge(repository.data.repository.stargazerCount)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Starred</DropdownMenuItem>
              <DropdownMenuItem>Unstar</DropdownMenuItem>
              <DropdownMenuItem>Add to list…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Fork origin info (second line) */}
      {repository.data.repository.isFork && repository.data.repository.parent && (
        <div className="ml-14 text-sm text-muted-foreground">
          Forked from{" "}
          <Link
            to={getInternalRepositoryPath(
              repository.data.repository.parent.url,
              "repositories",
              provider
            )}
            className="text-blue-600 hover:underline"
          >
            {repository.data.repository.parent.nameWithOwner}
          </Link>
        </div>
      )}

      <Separator />

      {/* Main Content */}
      <div className="flex space-x-6">
        {/* Left Column */}
        <div className="w-[80%] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BranchTagSelector
                selected={
                  repository.data.repository.defaultBranchRef.name
                }
                onSelect={(type, name) => {
                  router.push(`/${type}/${encodeURIComponent(name)}`);
                }}
                defaultBranch={
                  repository.data.repository.defaultBranchRef?.name
                }
                branches={repository.data.repository.branches.nodes.map(
                  (b) => b.name
                )}
                tags={repository.data.repository.tags.nodes.map((t) => t.name)}
                curPath={currentPath}
              />
              <div className="flex items-center text-sm">
                <GitBranch className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">
                  {repository.data.repository.branches.totalCount}
                </span>
                Branches
              </div>
              <div className="flex items-center text-sm">
                <Tag className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">
                  {repository.data.repository.tags.totalCount}
                </span>
                Tags
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input placeholder="Search…" className="h-8" />
              <Button size="sm">Add File</Button>
              <Button size="sm">Code</Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden">

            {branchcommits?.data?.repository?.ref?.target && typeof branchcommits.data.repository.ref.target === "object" && "oid" in branchcommits.data.repository.ref.target ? (
              (() => {
                const commit = branchcommits.data.repository.ref.target;
                const author = commit.author?.user;
                const signatureValid = commit.signature?.isValid;
                const check = commit.checkSuites?.nodes?.[0];

                const getStatusSymbol = (status?: string, conclusion?: string) => {
                  if (status && status !== "COMPLETED") return "•";
                  if (conclusion === "FAILURE") return "❌";
                  if (conclusion === "SUCCESS") return "✔️";
                  return "";
                };

                return (
                  <div className="flex items-center justify-between bg-muted p-2 text-sm font-medium space-x-4 overflow-hidden">
                    {/* Avatar & Login */}
                    <div className="flex items-center space-x-2 min-w-0">
                      {author?.avatarUrl && (
                        <img
                          src={author.avatarUrl}
                          alt={author.login}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="truncate text-muted-foreground font-mono">
                        {author?.login || commit.author.name}
                      </span>
                    </div>

                    {/* Commit Message */}
                    <div className="flex-1 truncate" title={commit.messageHeadline}>
                      {formatCommitMessageWithLinks(commit.messageHeadline, currentPath)}
                    </div>

                    {/* Signature */}
                    <div className="hidden sm:block text-muted-foreground">
                      {signatureValid ? "🔏 valid" : commit.signature ? "⚠️ invalid" : null}
                    </div>

                    {/* Check Status */}
                    <div className="text-xs text-muted-foreground">
                      {getStatusSymbol(check?.status, check?.conclusion)}
                    </div>

                    {/* SHA · Datum · Commits */}
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap text-xs font-mono">
                      <span className="text-primary-600">{commit.oid.slice(0, 8)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{formatRelativeTime(commit.committedDate)}</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <HistoryIcon className="w-4 h-4" />
                        {formatWithCommas(commit.history.totalCount)}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-5 bg-muted p-2" />
            )}

            {entries && entries.length > 0 && (
              entries
                .slice()
                .sort((a, b) => {
                  if (a.type === b.type) return 0;
                  return a.type === "tree" ? -1 : 1;
                })
                .map((entry, index) => {
                  const isDir = entry.type === "tree";

                  const href = `${currentPath}/${isDir ? "tree" : "blob"}/${defbranch}/${encodeURIComponent(entry.name)}`;
                  const Icon = isDir ? FolderIcon : FileIcon;

                  return (
                    <Link
                      key={index}
                      href={href}
                      className="grid grid-cols-12 gap-2 p-2 text-sm hover:bg-accent cursor-pointer"
                    >
                      {/* Name + Icon */}
                      <div className="flex items-center col-span-4">
                        <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                        {entry.name}
                      </div>

                      {/* Commit-Message */}
                      <div className="text-muted-foreground col-span-6 whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatCommitMessageWithLinks(entry.message, currentPath)}
                      </div>

                      {/* Datum */}
                      <div className="text-muted-foreground text-right col-span-2 whitespace-nowrap">
                        {formatRelativeTime(entry.committedDate)}
                      </div>
                    </Link>
                  );
                })
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            {/* Tabs + Actions */}
            <div className="border rounded-md overflow-hidden">
              <div className="flex justify-between items-center bg-muted px-4 py-2 border-b">
                <div className="flex gap-3 flex-wrap text-sm">
                  {tabList.map(({ key, filename, category }) => {
                    const isActive = key === activeTab;
                    const licenseInfo = repository?.data?.repository?.licenseInfo;

                    const label =
                      category === "license"
                        ? formatLicenseLabel(filename, licenseInfo?.name, licenseInfo?.key)
                        : filename;

                    return (
                      <Link
                        key={key}
                        href={`?tab=${key}#${key}`}
                        className={`px-2 py-1 border-b-2 ${
                          isActive
                            ? "border-primary text-primary font-semibold"
                            : "border-transparent hover:underline"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {iconMap[category as IconCategory]}
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={fileHref}>
                    <PencilIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                  <button className="relative group">
                    <BulletListIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    <div className="hidden group-hover:block absolute right-0 mt-2 bg-popover border rounded shadow-md z-10 p-2 text-sm">
                      <button className="block w-full text-left px-2 py-1 hover:bg-accent">Als Datei herunterladen</button>
                      <button className="block w-full text-left px-2 py-1 hover:bg-accent">Als Raw anzeigen</button>
                    </div>
                  </button>
                </div>
              </div>
              {/* show file content */}
              <MarkdownViewer id={`${activeFile.category}-ov-file`} provider={provider} owner={username} name={reponame} contentPath={activeFile.filename} ref={defbranch}></MarkdownViewer>
            </div>


          </div>
        </div>

        {/* Right Column */}
        <div className="w-[20%] space-y-4">
          {/* About-Header */}
          <div className="flex justify-between items-center text-sm font-medium">
            <span>About</span>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-snug">
            {repository.data.repository.description ??
              "No description, website, or topics provided."}
          </p>

          <div className="space-y-2 pt-1 text-sm text-muted-foreground">
            {detectedFiles.length > 0 && (
              <>
                {detectedFiles.map(({ category, filename }) => {
                  const tabKey = `${category}-ov-file`;
                  const licenseInfo = repository?.data?.repository?.licenseInfo;

                  const label =
                    category === "license"
                      ? formatLicenseLabel(filename, licenseInfo?.name || licenseInfo?.key)
                      : filename;

                  return (
                    <Link
                      key={category}
                      href={`?tab=${tabKey}#${tabKey}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      {iconMap[category as keyof typeof iconMap]}
                      {label}
                    </Link>
                  );
                })}
              </>
            )}

            <Link
              href={`${currentPath}/activity`}
              className="flex items-center gap-2 hover:underline text-primary"
            >
              <ActivityIcon className="w-4 h-4" />
              Activity
            </Link>

            <Link
              href={`${currentPath}/stargazer`}
              className="flex items-center gap-2 hover:underline"
            >
              <StarIcon className="w-4 h-4 text-yellow-500" />
              {formatNumber(repository.data.repository.stargazerCount)}{" "}
              {repository.data.repository.stargazerCount === 1 ? "Star" : "Stars"}
            </Link>

            <Link
              href={`${currentPath}/watchers`}
              className="flex items-center gap-2 hover:underline"
            >
              <EyeIcon className="w-4 h-4" />
              {formatNumber(repository.data.repository.watchers.totalCount)}{" "}
              {repository.data.repository.watchers.totalCount === 1 ? "Watcher" : "Watchers"}
            </Link>

            <Link
              href={`${currentPath}/forks`}
              className="flex items-center gap-2 hover:underline"
            >
              <ForkIcon className="w-4 h-4" />
              {formatNumber(repository.data.repository.forkCount)}{" "}
              {repository.data.repository.forkCount === 1 ? "Fork" : "Forks"}
            </Link>

          </div>

          <hr className="my-4 border-muted" />

          {/* Releases */}
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold flex items-center gap-2">
              Releases
              {repository.data.repository.releases.totalCount > 0 && (
                <Badge variant="secondary">
                  {repository.data.repository.releases.totalCount}
                </Badge>
              )}
            </h3>

            {repository.data.repository.releases.totalCount === 0 ? (
              <>
                <p className="text-muted-foreground">No releases published</p>
                <Link
                  href={`${currentPath}/releases/new`}
                  className="text-primary hover:underline"
                >
                  Publish a new release
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`${currentPath}/releases/${repository.data.repository.releases.nodes[0].tagName}`}
                  className="flex items-center gap-2 hover:underline text-primary"
                >
                  <TagIcon className="w-4 h-4" />
                  {repository.data.repository.releases.nodes[0].name ??
                    repository.data.repository.releases.nodes[0].tagName}
                  {(repository.data.repository.releases.nodes[0].isDraft || repository.data.repository.releases.nodes[0].isLatest) && (
                    <Badge variant="outline">
                      {repository.data.repository.releases.nodes[0].isDraft ? "Draft" : "Latest"}
                    </Badge>
                  )}
                </Link>
                <p className="text-xs text-muted-foreground pl-6">
                  {formatRelativeTime(
                    repository.data.repository.releases.nodes[0].createdAt
                  )}
                </p>
                {repository.data.repository.releases.totalCount > 1 && (
                  <Link
                    href={`${currentPath}/releases`}
                    className="pl-6 block text-muted-foreground hover:underline"
                  >
                    + {repository.data.repository.releases.totalCount - 1}{" "}
                    release
                    {repository.data.repository.releases.totalCount - 1 > 1
                      ? "s"
                      : ""}
                  </Link>
                )}
              </>
            )}
          </div>

          {Array.isArray(contributors) && contributors.length > 0 && (
            <>
              <hr className="my-4 border-muted" />

              <div className="space-y-2 text-sm">
                <h3 className="font-semibold flex items-center gap-2">
                  Contributors
                  <Badge variant="secondary">
                    {totalContributors}
                  </Badge>
                </h3>

                {/* Avatars */}
                <div className="flex flex-wrap gap-2">
                  {contributors.slice(0, 14).map((user) =>
                    user?.login && user?.avatarUrl && user?.htmlUrl ? (
                      <Link
                        key={user.login}
                        href={user.htmlUrl}
                        className="inline-block"
                        title={user.login}
                      >
                        <img
                          src={user.avatarUrl}
                          alt={`Avatar of ${user.login}`}
                          className="w-8 h-8 rounded-full ring-1 ring-muted"
                        />
                      </Link>
                    ) : null
                  )}
                </div>

                {/* +X Contributors */}
                {totalContributors > 14 && (
                  <Link
                    href="/contributors"
                    className="block text-sm text-muted-foreground hover:underline pl-1"
                  >
                    + {totalContributors - 14} contributors
                  </Link>
                )}
              </div>
            </>
          )}

          {repository.data.repository.deployments.totalCount > 0 && (
            <>
              <hr className="my-4 border-muted" />

              <div className="space-y-2 text-sm">
                <h3 className="font-semibold flex items-center gap-2">
                  Deployments
                  <Badge variant="secondary">
                    {repository.data.repository.deployments.totalCount}
                  </Badge>
                </h3>

                <div className="pl-1 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">
                      {repository.data.repository.deployments.nodes[0].environment}
                    </span>
                    <span className="text-muted-foreground text-xs uppercase">
                      {repository.data.repository.deployments.nodes[0].state}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(
                      repository.data.repository.deployments.nodes[0].createdAt
                    )}
                  </p>
                </div>

                {repository.data.repository.deployments.totalCount > 1 && (
                  <Link
                    href="/deployments"
                    className="pl-1 block text-muted-foreground hover:underline"
                  >
                    + {repository.data.repository.deployments.totalCount - 1} deployments
                  </Link>
                )}
              </div>
            </>
          )}

          {repository.data.repository.languages.totalSize > 0 && (
            <>
              <hr className="my-4 border-muted" />

              <div className="space-y-2 text-sm">
                <h3 className="font-semibold flex items-center gap-2">
                  Languages
                  <Badge variant="secondary">
                    {repository.data.repository.languages.edges.length}
                  </Badge>
                </h3>

                <div className="w-full h-3 rounded overflow-hidden flex" role="progressbar" aria-label="language usage">
                  {repository.data.repository.languages.edges.map(({ node, size }) => {
                    const total = repository.data.repository.languages.totalSize;
                    const percent = (size / total) * 100;
                    return (
                      <div
                        key={node.name}
                        title={`${node.name} – ${percent.toFixed(1)}%`}
                        style={{
                          width: `${percent}%`,
                          backgroundColor: node.color ?? "#ccc",
                        }}
                      />
                    );
                  })}
                </div>

                <ul className="space-y-1 pl-1">
                  {repository.data.repository.languages.edges.map(({ node, size }) => {
                    const total = repository.data.repository.languages.totalSize;
                    const percent = ((size / total) * 100).toFixed(1); // z. B. "12.4"
                    return (
                      <li key={node.name} className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: node.color ?? "#ccc" }}
                        />
                        <span className="text-muted-foreground">
                          {node.name} ({percent}%)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
