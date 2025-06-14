"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FileText, GitBranch, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OAuthRepository, OAuthRepositoryContents } from "@/types/types"; // ⬅️ Typ muss angepasst sein
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toQualifiedRef, formatNumber } from "@/lib/extractRepoPath";
import { EyeIcon, FileIcon, FolderIcon, ForkIcon, StarIcon } from "@/components/Icons";
import Link from "next/link";
import { BranchTagSelector } from "@/components/BranchTagSelector";

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
  const [loadingRepository, setLoadingRepository] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

      const parsed: ProviderRepositoryMap = JSON.parse(responseText);
      const repo = parsed[provider];
      if (!repo) throw new Error(`Kein Repository für Provider ${provider} gefunden`);
      setRepository(repo);

      const defbranch = repo?.data?.repository.defaultBranchRef?.name ?? "HEAD:";

      // Second fetch: get the initial content
      return fetchWithAuth(
        `/api/oauth/repositorycontents?provider=${provider}&owner=${encodeURIComponent(username)}&name=${encodeURIComponent(reponame)}&branch=${encodeURIComponent(toQualifiedRef(defbranch))}`,
        { credentials: "include" }
      );
    })
    .then(async (res) => {
      const responseText = await res.text();
      console.log("📄 Backend-Rohdaten (content):", responseText);

      if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

      const parsed: ProviderRepositoryContentMap = JSON.parse(responseText);
      const content = parsed[provider];
      if (!content) throw new Error(`Kein Repository-Inhalt für Provider ${provider} gefunden`);
      setRepositoryContent(content);
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
          <h1 className="text-2xl font-bold">{repository.data.repository.name}</h1>
          <Badge variant="outline" className="text-xs rounded-full">
            {repository.data.repository.isPrivate ? "private" : "public"}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">Pin</Button>
          <Button variant="secondary" size="sm">Unwatch</Button>
          <Button variant="secondary" size="sm">Star</Button>
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
                selected={repository.data.repository.defaultBranchRef.name ?? "main"}
                onSelect={(type, name) => {
                  router.push(`/${type}/${encodeURIComponent(name)}`);
                }} 
                defaultBranch={repository.data.repository.defaultBranchRef?.name ?? "main"}
                branches={repository.data.repository.branches.nodes.map((b) => b.name)}
                tags={repository.data.repository.tags.nodes.map((t) => t.name)}
                curPath={currentPath}
              />
              <div className="flex items-center text-sm">
                <GitBranch className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">{repository.data.repository.branches.totalCount}</span>Branches
              </div>
              <div className="flex items-center text-sm">
                <Tag className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">{repository.data.repository.tags.totalCount}</span>Tags
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
            <div className="grid grid-cols-3 bg-muted p-2 text-sm font-medium">
              <div>Dateiname</div>
              <div>Letzter Commit</div>
              <div>Letzte Änderung</div>
            </div>

            {repositorycontent?.data?.repository?.object?.entries?.length ? (
              repositorycontent.data.repository.object.entries
                .slice() // Copy to sort without mutations
                .sort((a, b) => {
                  if (a.type === b.type) return 0;
                  return a.type === "tree" ? -1 : 1;
                })
                .map((entry, index) => {
                  const isDir = entry.type === "tree";
                  const defbranch = repository?.data?.repository?.defaultBranchRef?.name
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
                      <div className="text-muted-foreground">–</div>
                      <div className="text-muted-foreground">–</div>
                    </Link>
                  );
                })
            ) : null}

          </div>
        </div>

        {/* Right Column */}
        <div className="w-[20%] space-y-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>About</span>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground leading-snug">
            {repository.data.repository.description ?? "Kein Beschreibungstext vorhanden."}
          </p>
          <p className="text-sm text-muted-foreground pt-2 flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-500" />
              <span>{formatNumber(repository.data.repository.stargazerCount)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <ForkIcon className="w-4 h-4 text-muted-foreground" />
              <span>{formatNumber(repository.data.repository.forkCount)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4 text-muted-foreground" />
              <span>{formatNumber(repository.data.repository.watchers.totalCount)}</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
