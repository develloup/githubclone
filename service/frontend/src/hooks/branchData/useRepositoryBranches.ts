import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepositoryBranchInfo } from "@/types/typesBranch";
import { useQuery } from "@tanstack/react-query";

type ProviderRepositoryBranchesMap = Record<string, OAuthRepositoryBranchInfo>

export function useRepositoryBranches(
    provider: string,
    owner: string,
    reponame: string
) {
    return useQuery({
        queryKey: ["gitbranches", provider, owner, reponame],
        queryFn: async () => {
            const res = await fetchWithAuth(
                `/api/oauth/repositorybranches?provider=${provider}&owner=${encodeURIComponent(owner
                )}&name=${encodeURIComponent(reponame)}`,
                { credentials: "include" }
            );

            const raw = await res.text();
            console.log("Raw data from backend (repositorybranches)): ", raw);
            if (!res.ok) throw new Error(`Error druing the loading of repositorybranches: ${raw}`);

            const parsed: ProviderRepositoryBranchesMap = JSON.parse(raw);
            return parsed[provider];
        },
        enabled: !!reponame && !!provider && !!owner,
        staleTime: 5 * 60 * 1000,
        retry: 1
    });
}