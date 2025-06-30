import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useQuery } from "@tanstack/react-query";

type GitmodulesResponse = {
  text: string;
};

type ProviderGitmodulesMap = Record<string, GitmodulesResponse>;

/**
 * Loads the `.gitmodules` file from the given repository/branch – if present.
 *
 * @param provider   OAuth provider (e.g. "github")
 * @param owner      Repository owner
 * @param reponame   Repository name
 * @param branch     Branch or ref expression (e.g. "main")
 * @param enabled    Whether to trigger the fetch (e.g. only if ".gitmodules" exists)
 */
export function useGitmodules(
  provider: string,
  owner: string,
  reponame: string,
  branch?: string,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ["gitmodules", provider, owner, reponame, branch],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/oauth/repositoryblob?provider=${provider}&owner=${encodeURIComponent(
          owner
        )}&name=${encodeURIComponent(reponame)}&expression=${encodeURIComponent(
          `${branch}:.gitmodules`
        )}`,
        { credentials: "include" }
      );

      const raw = await res.text();
      if (!res.ok) throw new Error(`Fehler beim Laden von .gitmodules: ${raw}`);

      const parsed: ProviderGitmodulesMap = JSON.parse(raw);
      return parsed[provider]?.text ?? null;
    },
    enabled: !!branch && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
