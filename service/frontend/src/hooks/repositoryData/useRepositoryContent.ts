import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepositoryContents } from "@/types/typesRepository";
import { useQuery } from "@tanstack/react-query";


type ProviderRepositoryContentMap = Record<string, OAuthRepositoryContents>;


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
      console.log("Raw data from backend (Repository contents): ", raw);
      if (!res.ok) throw new Error(`Error during the loading of contents: ${raw}`);

      const parsed: ProviderRepositoryContentMap = JSON.parse(raw);
      const content = parsed[provider];

      if (!content)
        throw new Error(`Not found any contents for provider ${provider}`);
      console.log("Parsed data from repository contents: ", content);
      return content;
    },
    enabled: !!expression, // Activate query only, if there is an expression available
    staleTime: 5 * 60 * 1000, // valid 5 minutes
    retry: 1,
  });
}
