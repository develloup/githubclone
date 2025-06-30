import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepositoryBranchCommit } from "@/types/typesRepository";
import { useQuery } from "@tanstack/react-query";


type ProviderRepositoryBranchCommitMap = Record<string, OAuthRepositoryBranchCommit>;

/**
 * Loads commit history for a specific branch in a repository.
 *
 * @param provider - OAuth provider (e.g., "github")
 * @param owner - Repository owner
 * @param name - Repository name
 * @param expression - Ref expression (e.g., branch name or "refs/heads/main")
 * @returns The branch commit history
 */
export function useBranchCommits(
  provider: string,
  owner: string,
  name: string,
  expression?: string
) {
  return useQuery({
    queryKey: ["branchcommits", provider, owner, name, expression],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/oauth/repositorybranchcommit?provider=${provider}&owner=${encodeURIComponent(
          owner
        )}&name=${encodeURIComponent(name)}&expression=${encodeURIComponent(
          expression!
        )}`,
        { credentials: "include" }
      );

      const raw = await res.text();
      console.log("Raw data from backend (Branchcommits):", raw)
      if (!res.ok) throw new Error(`Error during the loading of commits: ${raw}`);

      const parsed: ProviderRepositoryBranchCommitMap = JSON.parse(raw);
      const branchData = parsed[provider];

      if (!branchData)
        throw new Error(`Not found any commits for orovider ${provider}`);

      return branchData;
    },
    enabled: !!expression,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
