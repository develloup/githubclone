import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useQuery } from "@tanstack/react-query";

type GitmodulesResponse = {
  content: string;
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
  branch: string,
  enabled: boolean = false
) {
  // console.log(`useGitmodules: ${provider}, ${owner}, ${reponame}, ${branch}, ${enabled}`)
  return useQuery({
    queryKey: ["gitmodules", provider, owner, reponame, branch],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/oauth/repositorycontent?provider=${provider}&owner=${encodeURIComponent(owner
        )}&name=${encodeURIComponent(reponame)}&content=${encodeURIComponent(".gitmodules")}&expression=${encodeURIComponent(
          branch
        )}`,
        { credentials: "include" }
      );

      const raw = await res.text();
      // console.log("Raw data from backend (.gitmodules)): ", raw);
      if (!res.ok) throw new Error(`Error during the loading of .gitmodules: ${raw}`);

      const parsed: ProviderGitmodulesMap = JSON.parse(raw);
      // console.log("Provider:     ", provider);
      // console.log("Return value: ", parsed[provider]?.content ?? null);
      return parsed[provider]?.content ?? null;
    },
    enabled: !!branch && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
