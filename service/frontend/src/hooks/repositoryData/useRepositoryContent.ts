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
      // console.log("Raw data from backend (Repository contents): ", raw);
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

export function useRepositoryContentsPartial(
  provider: string,
  username: string,
  reponame: string,
  expression: string | undefined,
  startname: string | null | undefined,
  maxcount: number
) {
  console.log("useRepositoryContentsPartial:");
  console.log("provider:   ", provider);
  console.log("username:   ", username);
  console.log("reponame:   ", reponame);
  console.log("expression: ", expression);
  console.log("startname:  ", startname);
  console.log("maxcount:   ", maxcount);

  return useQuery({
    queryKey: ["repositorycontentspartial", provider, username, reponame, expression, startname, maxcount],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/oauth/repositorycontents?provider=${provider}&owner=${encodeURIComponent(
          username
        )}&name=${encodeURIComponent(
          reponame
        )}&expression=${encodeURIComponent(expression!)}&start=${encodeURIComponent(
          startname ?? ""
        )}&limit=${maxcount}`,
        {
          credentials: "include"
        }
      );

      const raw = await res.text();
      console.log("Raw data from backend (Repository contents partial): ", raw);
      if (!res.ok) throw new Error(`Error during the loading of contents: ${raw}`);

      const parsed: ProviderRepositoryContentMap = JSON.parse(raw);
      const content = parsed[provider];

      if (!content)
        throw new Error(`Not found any contents for provider ${provider}`);
      console.log("Parsed data from repository contents partial: ", content);
      return content;
    },
    enabled: typeof expression === "string" &&
      expression.trim().length > 0 &&
      typeof startname === "string" &&
      startname.trim().length > 0 &&
      typeof maxcount === "number" &&
      maxcount > 0, // activate query ony, if there is an expression available, a startname and a count which is bigger than zero
    staleTime: 0,
    retry: 1
  })
}
