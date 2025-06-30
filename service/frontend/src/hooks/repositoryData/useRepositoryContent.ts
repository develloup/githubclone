import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useQuery } from "@tanstack/react-query";

type EntryType = "blob" | "tree" | "commit";

export type RepositoryEntry = {
  name: string;
  type: EntryType;
  mode: number;
  oid: string;
  message: string;
  committedDate: string;
};

export type RepositoryContents = {
  repository: {
    object: {
      entries: RepositoryEntry[];
    } | null;
  } | null;
};

type ProviderRepositoryContentMap = Record<string, RepositoryContents>;

type FetchParams = {
  provider: string;
  username: string;
  reponame: string;
  expression: string;
};

/**
 * Fetches the contents (entries) of a specific path or branch within a repository.
 * 
 * @param provider     OAuth provider (e.g. "github", "gitlab")
 * @param username     Repository owner
 * @param reponame     Repository name
 * @param expression   Git expression (e.g. "main", "feature:subfolder")
 * @returns The repository contents if available
 */
export function useRepositoryContents(
  provider: string,
  username: string,
  reponame: string,
  expression: string | undefined
) {
  return useQuery({
    queryKey: ["repositorycontents", provider, username, reponame, expression],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/oauth/repositorycontents?provider=${provider}&owner=${encodeURIComponent(
          username
        )}&name=${encodeURIComponent(
          reponame
        )}&expression=${encodeURIComponent(expression!)}`,
        {
          credentials: "include",
        }
      );

      const raw = await res.text();
      if (!res.ok) throw new Error(`Fehler beim Laden der Inhalte: ${raw}`);

      const parsed: ProviderRepositoryContentMap = JSON.parse(raw);
      const content = parsed[provider];

      if (!content)
        throw new Error(`Keine Inhalte für Provider ${provider} gefunden`);

      return content;
    },
    enabled: !!expression, // Query nur aktivieren, wenn expression vorhanden
    staleTime: 5 * 60 * 1000, // 5 Minuten gültig
    retry: 1,
  });
}
