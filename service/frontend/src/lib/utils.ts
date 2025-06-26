import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function transformUrl(externalUrl: string, provider: string): string {
  const url = new URL(externalUrl);
  const pathname = url.pathname.replace(/^\/+/, "");
  return `${window.location.origin}/repositories/${provider}/${pathname}`;
}


export function getInternalRepositoryPath(externalUrl: string, prefix: string, provider: string): string {
  const url = new URL(externalUrl);
  const pathname = url.pathname.replace(/^\/+/, "");
  return `/${prefix}/${provider}/${pathname}`;
}


export function parseGitmodules(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /\[submodule "(.*?)"]\s+path = (.*?)\s+url = (.*?)(\s|$)/gs;

  let match;
  while ((match = regex.exec(text))) {
    const [, name, path, url] = match;
    result[path.trim()] = url.trim();
  }

  return result;
}


// Decode base64 with unicode-support
export function decodeBase64(input: string): string {
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "(Fehler beim Dekodieren)";
  }
}

