export function extractRepoPath(repoUrl: string): string | null {
  try {
    const url = new URL(repoUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1]}`;
    }
  } catch (err) {
    console.warn("Invalid URL:", repoUrl, err);
  }
  return null;
}


