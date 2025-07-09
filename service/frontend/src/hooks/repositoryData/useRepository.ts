import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepository } from "@/types/typesRepository";
import { useQuery } from "@tanstack/react-query";

type ProviderRepositoryMap = Record<string,OAuthRepository>;

/**
 * Custom React Query hook to fetch repository metadata for a given provider.
 * 
 * @param provider - The Git hosting provider (e.g. "github", "gitlab")
 * @param owner - The username or organization that owns the repository
 * @param name - The name of the repository
 * @returns Repository metadata from the backend API
 */
export function useRepository(provider: string, owner: string, name: string) {
  return useQuery({
    // Unique query key for React Query caching and invalidation
    queryKey: ["repository", provider, owner, name],

    // Asynchronous function to fetch repository data from the backend
    queryFn: async () => {
      // Make an authenticated request to the backend endpoint for repository info
      const res = await fetchWithAuth(
        `/api/oauth/repository?provider=${provider}&owner=${owner}&name=${name}`
      );

      // Get raw response as text (could also use res.json() directly if backend returns JSON)
      const raw = await res.text();

      // Optional: log raw response for debugging
      console.log("Raw data from backend (Repository): ", raw);

      // Throw error if the backend response indicates failure
      if (!res.ok) throw new Error(raw);

      // Parse the raw response into the expected provider-specific map
      const parsed: ProviderRepositoryMap = JSON.parse(raw);

      // Extract the repository data for the current provider
      const repository = parsed[provider];

      // If repository is missing, throw an error
      if (!repository)
        throw new Error(`Not found a repository for provider ${provider}`);

      // Return the loaded repository metadata
      return repository;
    },
  });
}