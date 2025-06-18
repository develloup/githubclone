import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { RepositoryFile } from "@/types/types";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

// 🧠 Base64 sicher decodieren mit Unicode-Support
function decodeBase64(input: string): string {
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "(Fehler beim Dekodieren)";
  }
}


type MarkdownViewerProps = {
  provider: string;
  owner: string;
  name: string;
  ref?: string;
  contentPath: string;
};
// 📘 Komponente: MarkdownViewer
export function MarkdownViewer({
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
        if (ref) url.searchParams.set("ref", ref);

        const res = await fetchWithAuth(url.toString());
        const text = await res.text();
        console.log("📦 Rohdaten vom Backend (Content):", text);

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

        const data: RepositoryFile = JSON.parse(text);
        setFile(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unbekannter Fehler");
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
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>{decoded}</ReactMarkdown>
    </div>
  );
}
