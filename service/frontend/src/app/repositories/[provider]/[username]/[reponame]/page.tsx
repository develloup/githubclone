"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FileText, GitBranch, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { OAuthRepository, OAuthRepositoryBranchCommit, OAuthRepositoryContents, RepositoryCollaboratorNode, RepositoryCollaborators } from "@/types/types"; // ⬅️ Typ muss angepasst sein
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toQualifiedRef, formatNumber } from "@/lib/extractRepoPath";
import {
  ActivityIcon,
  CodeOfConductIcon,
  ContributingIcon,
  EyeIcon,
  FileIcon,
  FolderIcon,
  ForkIcon,
  HistoryIcon,
  LicenseIcon,
  ReadmeIcon,
  SecurityIcon,
  StarIcon,
  TagIcon,
} from "@/components/Icons";
import Link from "next/link";
import { BranchTagSelector } from "@/components/BranchTagSelector";
import { formatRelativeTime, formatWithCommas } from '../../../../../lib/format';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { detectStandardFilesFromEntries } from "@/lib/detectStandardFiles";

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
  const [repositorycontent, setRepositoryContent] =
    useState<OAuthRepositoryContents | null>(null);
  const [contributors, setContributors] = useState<RepositoryCollaboratorNode[] | null>(null);
  const [totalContributors, setTotalContributors] = useState<number>(0);
  const [branchcommits, setBranchCommits] = useState<OAuthRepositoryBranchCommit | null>(null);
  const [loadingRepository, setLoadingRepository] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  let defbranch:string = "";

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
    if (!provider || !username || !reponame) return;

    setLoadingRepository(true);
    setLoadingContent(true);
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
          throw new Error(`Kein Repository für Provider ${provider} gefunden`);
        setRepository(repo);

        defbranch = repo?.data?.repository.defaultBranchRef?.name ?? "HEAD:";

        // Second fetch: get the initial content
        return fetchWithAuth(
          `/api/oauth/repositorycontents?provider=${provider}&owner=${encodeURIComponent(
            username
          )}&name=${encodeURIComponent(reponame)}&branch=${encodeURIComponent(
            toQualifiedRef(defbranch)
          )}`,
          { credentials: "include" }
        );
      })
      .then(async (res) => {
        const responseText = await res.text();
        console.log("📄 Backend-Rohdaten (content):", responseText);

        if (!res.ok)
          throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed: ProviderRepositoryContentMap = JSON.parse(responseText);
        const content = parsed[provider];
        if (!content)
          throw new Error(
            `Kein Repository-Inhalt für Provider ${provider} gefunden`
          );
        setRepositoryContent(content);

        // Third fetch: get contributors
        return fetchWithAuth(
          `/api/oauth/repositorycontributors?provider=${provider}&owner=${encodeURIComponent(username)}&name=${encodeURIComponent(reponame)}`,
          { credentials: "include" }
        );

      })
      .then(async (res) => {
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

        // Fourth fetch: get branch commits
        return fetchWithAuth(
          `/api/oauth/repositorybranchcommit?provider=${provider}&owner=${encodeURIComponent(username)}&name=${encodeURIComponent(reponame)}&expression=${encodeURIComponent(toQualifiedRef(defbranch))}`,
          { credentials: "include" }
        );

      })
      .then(async (res) => {
        const responseText = await res.text();
        console.log("Backend-Rohdaten (branchcommit):", responseText)

        if (!res.ok)
          throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed = JSON.parse(responseText);
        const branchcommits = parsed[provider];

        if (!branchcommits)
          throw new Error("Invalid Branch commit data structure");

        setBranchCommits(branchcommits)
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

  const detectedFileNames = useMemo(() => {
    return new Set(detectedFiles.map((f) => f.filename.toLowerCase()))
  }, [detectedFiles])

  const entries = repositorycontent?.data?.repository?.object?.entries;


  if (loadingRepository || error || !repository)
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
            {repository.data.repository.isPrivate ? "private" : "public"}
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

      <Separator />

      {/* Main Content */}
      <div className="flex space-x-6">
        {/* Left Column */}
        <div className="w-[80%] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BranchTagSelector
                selected={
                  repository.data.repository.defaultBranchRef.name ?? "main"
                }
                onSelect={(type, name) => {
                  router.push(`/${type}/${encodeURIComponent(name)}`);
                }}
                defaultBranch={
                  repository.data.repository.defaultBranchRef?.name ?? "main"
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

            {branchcommits ? (() => {
              const commit = branchcommits.data.repository.ref.target
              const author = commit.author?.user
              const signatureValid = commit.signature?.isValid
              const check = commit.checkSuites?.nodes?.[0]

              const getStatusSymbol = (status?: string, conclusion?: string) => {
                if (status && status !== "COMPLETED") return "•"
                if (conclusion === "FAILURE") return "❌"
                if (conclusion === "SUCCESS") return "✔️"
                return ""
              }

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
                    {commit.messageHeadline}
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
                    <span className="text-primary-600">
                      {commit.oid.slice(0, 8)}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span>
                      {formatRelativeTime(commit.committedDate)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <HistoryIcon className="w-4 h-4" />
                      {formatWithCommas(commit.history.totalCount)}
                    </span>
                  </div>
                </div>
              )
            })() : (
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
                  const defbranch = repository?.data?.repository?.defaultBranchRef?.name;
                  const href = `${currentPath}/${isDir ? "tree" : "blob"}/${defbranch}/${encodeURIComponent(entry.name)}`;
                  const Icon = isDir ? FolderIcon : FileIcon;

                  return (
                    <Link
                      key={index}
                      href={href}
                      className="grid grid-cols-3 p-2 text-sm hover:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                        {entry.name}
                      </div>
                      <div className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {entry.message}
                      </div>
                      <div className="text-muted-foreground text-right justify-self-end">
                        {formatRelativeTime(entry.committedDate)}
                      </div>
                    </Link>
                  );
                })
            )}
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

            <Link
              href={`${currentPath}/activity`}
              className="flex items-center gap-2 hover:underline text-primary"
            >
              <ActivityIcon className="w-4 h-4" />
              Activity
            </Link>

            {detectedFiles.length > 0 && (
              <>
                {detectedFiles.map(({ category, filename }) => (
                  <Link
                    key={category}
                    href={`${currentPath}/blob/${defbranch}/${encodeURIComponent(filename)}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    {iconMap[category]}
                    {category.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                  </Link>
                ))}
              </>
            )}
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
