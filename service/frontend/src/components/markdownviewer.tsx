import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ProviderRepositoryFileContentsMap, RepositoryFile } from "@/types/types";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { decodeBase64 } from "@/lib/utils";

type MarkdownViewerProps = {
  id: string;
  provider: string;
  owner: string;
  name: string;
  ref?: string;
  contentPath: string;
};


// Component: MarkdownViewer
export function MarkdownViewer({
  id,
  provider,
  owner,
  name,
  ref,
  contentPath,
}: MarkdownViewerProps) {
  const [file, setFile] = useState<RepositoryFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchFile = async () => {
      try {
        const url = new URL("/api/oauth/repositorycontent", window.location.origin);
        url.searchParams.set("provider", provider);
        url.searchParams.set("owner", owner);
        url.searchParams.set("name", name);
        url.searchParams.set("content", contentPath);
        if (ref) url.searchParams.set("expression", ref);

        const res = await fetchWithAuth(url.toString());
        const responseText = await res.text();
        console.log("📦 Rohdaten vom Backend (FileContent):", responseText);

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${responseText}`);
        const parsed: ProviderRepositoryFileContentsMap = JSON.parse(responseText);
        const data = parsed[provider];
        setFile(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      }
    };

    fetchFile();
  }, [provider, owner, name, contentPath, ref]);

  if (error) {
    return (
      <div className="text-destructive">
        ⚠️ Fehler beim Laden: <span className="font-mono">{error}</span>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="text-muted-foreground animate-pulse">
        Lade Inhalt…
      </div>
    );
  }

  const decoded = decodeBase64(file.content);

  if (!file.mime.startsWith("text/") && !file.mime.includes("markdown")) {
    return (
      <div className="text-red-500">
        ⚠️ Nicht darstellbares Format: <code>{file.mime}</code>
      </div>
    );
  }

  return (
    <>
    {file.mime.includes("markdown") ? (
      <div id={id} className="prose prose-sm dark:prose-invert max-w-4xl mx-auto px-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{decoded}</ReactMarkdown>
      </div>
    ) : (
      <pre id={id} className="text-sm whitespace-pre-wrap overflow-auto max-w-4xl mx-auto p-4">
        {decoded}
      </pre>
    )}
    </>
  );
}
