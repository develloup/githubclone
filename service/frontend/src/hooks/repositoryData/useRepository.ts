import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useQuery } from "@tanstack/react-query";

export function useRepository(provider: string, owner: string, name: string) {
  return useQuery({
    queryKey: ["repository", provider, owner, name],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/oauth/repository?provider=${provider}&owner=${owner}&name=${name}`);
      const raw = await res.text();
      console.log("Raw data from backend (Repository): ", raw);
      if (!res.ok) throw new Error(raw);
      const parsed = JSON.parse(raw);
      return parsed[provider]; // make the mapping to the provider
    },
  });
}
