export function extractRepoPath(repoUrl: string): string | null {
  try {
    const url = new URL(repoUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1]}`;
    }
  } catch (err) {
    console.warn("⚠️ Ungültige URL:", repoUrl, err);
  }
  return null;
}

export function toQualifiedRef(ref: string): string {
  return ref.startsWith("refs/") ? ref : `refs/heads/${ref}`;
}


export function formatNumber(value: number): string {
  if (value < 1_000) return `${value}`;
  if (value < 1_000_000) return `${Math.floor(value / 1_000)}k`;
  if (value < 1_000_000_000) return `${Math.floor(value / 1_000_000)}m`;
  return `${Math.floor(value / 1_000_000_000)}t`;
}
