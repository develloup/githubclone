"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FileText, GitBranch, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OAuthRepository } from "@/types/types"; // ⬅️ Typ muss angepasst sein

type ProviderRepositoryMap = {
  [provider: string]: OAuthRepository;
};

export default function RepositoryPage() {
  const params = useParams();
  const { provider, username, reponame } = params as {
    provider: string;
    username: string;
    reponame: string;
  };

  const [repository, setRepository] = useState<OAuthRepository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || !username || !reponame) return;

    setLoading(true);
    setError(null);

    fetch(
      `/api/oauth/repository?provider=${provider}&owner=${username}&name=${reponame}`,
      { credentials: "include" }
    )
      .then(async (res) => {
        const responseText = await res.text();
        console.log("📦 Backend-Rohdaten:", responseText);

        if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsed: ProviderRepositoryMap = JSON.parse(responseText);
        const repo = parsed[provider];
        if (!repo) throw new Error(`Kein Repository für Provider ${provider} gefunden`);
        setRepository(repo);
      })
      .catch((err) => {
        console.error("❌ Fehler beim Laden:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [provider, username, reponame]);

  if (loading) return <div className="text-gray-500">Lade Repository-Daten …</div>;
  if (error) return <div className="text-red-500">Fehler: {error}</div>;
  if (!repository) return <div className="text-gray-500">Kein Repository gefunden.</div>;

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
              <Button variant="default" size="sm">
                {repository.data.repository.defaultBranchRef?.name ?? "main"}
              </Button>
              <div className="flex items-center text-sm">
                <GitBranch className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">4</span>Branches
              </div>
              <div className="flex items-center text-sm">
                <Tag className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">2</span>Tags
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
            <div className="grid grid-cols-3 p-2 text-sm hover:bg-accent cursor-pointer">
              <div><FileText className="inline w-4 h-4 mr-2" />README.md</div>
              <div>Init commit</div>
              <div>vor 2 Tagen</div>
            </div>
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
          <p className="text-sm text-muted-foreground pt-2">
            ⭐ {repository.data.repository.stargazerCount}  ·  🍴 {repository.data.repository.forkCount}
          </p>
        </div>
      </div>
    </div>
  );
}
