import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepositoryBranchInfo } from "@/types/typesBranch";
import { useQuery } from "@tanstack/react-query";

type ProviderRepositoryBranchesMap = Record<string, OAuthRepositoryBranchInfo>;

export function useRepositoryBranches(
    provider: string,
    owner: string,
    reponame: string,
    tab: string = "0",
    page: string = "1"
) {
    async function fetchBranchesWithRetry(): Promise<OAuthRepositoryBranchInfo> {
        const maxAttempts = 10;
        const baseDelay = 250;

        const params = new URLSearchParams({
            provider,
            owner,
            name: reponame
        });

        if (tab !== "0") {
            params.append("tab", tab);
        }

        if (page !== "1") {
            params.append("page", page);
        }

        const url = `/api/oauth/repositorybranches?${params.toString()}`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const res = await fetchWithAuth(url, { credentials: "include" });
            const raw = await res.text();

            console.log(`Attempt ${attempt}: Status ${res.status}, Delay ${Math.min(baseDelay + attempt * 75, 1000)}ms`);

            if (res.status === 200) {
                const parsed: ProviderRepositoryBranchesMap = JSON.parse(raw);
                return parsed[provider];
            }

            if (res.status === 202) {
                const delay = Math.min(baseDelay + attempt * 75, 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`Error during loading of branch data: ${res.status} – ${raw}`);
        }

        throw new Error("Timeout: backend didn't provide data");
    }

    return useQuery({
        queryKey: ["gitbranches", provider, owner, reponame, tab !== "0" ? tab : null, page !== "1" ? page : null].filter(Boolean),
        queryFn: fetchBranchesWithRetry,
        enabled: !!provider && !!owner && !!reponame,
        staleTime: 5 * 60 * 1000,
        retry: false
    });
}
