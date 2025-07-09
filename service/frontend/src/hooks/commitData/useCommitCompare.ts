import { useQuery } from "@tanstack/react-query"
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ForkComparison } from "@/types/typesCommit";

type ProviderForkComparisonMap = Record<string, ForkComparison>;

export function useCommitCompare(
  provider: string,
  sourceOwner: string,
  sourceName: string,
  sourceBranch: string,
  targetOwner: string,
  targetName: string,
  targetBranch: string,
  hasFork: boolean
) {
  return useQuery({
    queryKey: [
      "commitcompare",
      provider,
      sourceOwner,
      sourceName,
      sourceBranch,
      targetOwner,
      targetName,
      targetBranch],
    queryFn: async () => {
      if (!parent)
        throw new Error("Cannot fetch commit comparison: parent is null");

      const url = `/api/oauth/commitscompare?` +
        `provider=${provider}` +
        `&sourceowner=${encodeURIComponent(sourceOwner)}` +
        `&sourcename=${encodeURIComponent(sourceName)}` +
        `&sourcebranch=${encodeURIComponent(sourceBranch)}` +
        `&targetowner=${encodeURIComponent(targetOwner)}` +
        `&targetname=${encodeURIComponent(targetName)}` +
        `&targetbranch=${encodeURIComponent(targetBranch)}`
      const res = await fetchWithAuth(
        url,
        { credentials: "include" }
      );

      const raw = await res.text();
      console.log("Raw data from backend (CommitsCompare):", raw);
      if (!res.ok) throw new Error(`Error during the loading of commits compare: ${raw}`);

      const parsed: ProviderForkComparisonMap = JSON.parse(raw);
      const commitsCompare = parsed[provider];

      if (!commitsCompare)
        throw new Error(`Not found any commits compares for provider ${provider}`)

      return commitsCompare;
    },
    enabled:
      hasFork &&
      !!sourceOwner && !!sourceName && !!sourceBranch &&
      !!targetOwner && !!targetName && !!targetBranch,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
