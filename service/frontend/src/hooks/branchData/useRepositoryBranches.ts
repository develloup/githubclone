import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepositoryBranchInfo } from "@/types/typesBranch";
import { useQuery } from "@tanstack/react-query";

type ProviderRepositoryBranchesMap = Record<string, OAuthRepositoryBranchInfo>;

export function useRepositoryBranches(
    provider: string,
    owner: string,
    reponame: string
) {
    async function fetchBranchesWithRetry(): Promise<OAuthRepositoryBranchInfo> {
        const maxAttempts = 10;
        const baseDelay = 250; // ms
        const url = `/api/oauth/repositorybranches?provider=${provider}&owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(reponame)}`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const res = await fetchWithAuth(url, { credentials: "include" });
            const raw = await res.text();

            console.log(`Attempt ${attempt}: Status ${res.status}, Delay ${Math.min(baseDelay + attempt * 75, 1000)}ms`);

            if (res.status === 200) {
                const parsed: ProviderRepositoryBranchesMap = JSON.parse(raw);
                return parsed[provider];
            }

            if (res.status === 202) {
                const delay = Math.min(baseDelay + attempt * 75, 1000); // linear growth
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`Error during loading of branch data: ${res.status} – ${raw}`);
        }

        throw new Error("⏳ Timeout: backend didn't provide data");
    }

    return useQuery({
        queryKey: ["gitbranches", provider, owner, reponame],
        queryFn: fetchBranchesWithRetry,
        enabled: !!provider && !!owner && !!reponame,
        staleTime: 5 * 60 * 1000,
        retry: false // Retry is completely handled by code above
    });
}
