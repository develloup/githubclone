import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { OAuthRepositoryTagInfo } from "@/types/typesTag";
import { useQuery } from "@tanstack/react-query";

type ProviderRepositoryTagsMap = Record<string, OAuthRepositoryTagInfo>;

export function useRepositoryTags(
    provider: string,
    owner: string,
    reponame: string,
    page: string = "1"
) {
    async function fetchTagsWithRetry(): Promise<OAuthRepositoryTagInfo> {
        const maxAttempts = 10;
        const baseDelay = 250;

        const params = new URLSearchParams({
            provider,
            owner,
            name: reponame
        });

        if (page !== "1") {
            params.append("page", page);
        }

        const url = `/api/oauth/repositorytags?${params.toString()}`;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const res = await fetchWithAuth(url, { credentials: "include" });
            const raw = await res.text();

            console.log(`Attempt ${attempt}: Status ${res.status}, Delay ${Math.min(baseDelay + attempt * 75, 1000)}ms`);

            if (res.status === 200) {
                const parsed: ProviderRepositoryTagsMap = JSON.parse(raw);
                return parsed[provider];
            }

            if (res.status === 202) {
                const delay = Math.min(baseDelay + attempt * 75, 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`Error during loading of tag data: ${res.status} – ${raw}`);
        }

        throw new Error("Timeout: backend didn't provide data");
    }

    return useQuery({
        queryKey: ["gittags", provider, owner, reponame, page !== "1" ? page : null].filter(Boolean),
        queryFn: fetchTagsWithRetry,
        enabled: !!provider && !!owner && !!reponame,
        staleTime: 5 * 60 * 1000,
        retry: false
    });
}
