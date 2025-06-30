import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { RepositoryCollaborators } from "@/types/typesRepository";
import { useQuery } from "@tanstack/react-query";


type ProviderContributorMap = Record<string, RepositoryCollaborators>;

/**
 * Loads the list of contributors for a given repository.
 *
 * @param provider   OAuth provider (e.g. "github")
 * @param owner      Repository owner
 * @param reponame   Repository name
 * @param enabled    Optional flag to control if the query runs
 * @returns A list of contributors (RepositoryCollaborators)
 */
export function useContributors(
  provider: string,
  owner: string,
  reponame: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["contributors", provider, owner, reponame],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/oauth/repositorycontributors?provider=${provider}&owner=${encodeURIComponent(
          owner
        )}&name=${encodeURIComponent(reponame)}`,
        { credentials: "include" }
      );

      const raw = await res.text();
      if (!res.ok) throw new Error(`Fehler beim Laden der Contributors: ${raw}`);

      const parsed: ProviderContributorMap = JSON.parse(raw);
      const contributors = parsed[provider];

      if (!contributors || !Array.isArray(contributors.nodes))
        throw new Error("Ungültige Contributor-Datenstruktur");

      return contributors;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
