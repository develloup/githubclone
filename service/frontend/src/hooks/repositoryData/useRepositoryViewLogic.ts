import { useMemo } from "react";
import { decodeBase64, parseGitmodules } from "@/lib/utils";
import { useRepository } from "./useRepository";
import { useRepositoryContents } from "./useRepositoryContent";
import { useContributors } from "./useContributors";
import { useBranchCommits } from "./useBranchCommits";
import { useGitmodules } from "./useGitmodules";
import { useCommitCompare } from "../commitData/useCommitCompare";
import { useRepositoryCommitLoader } from "./useRepositoryCommitLoader";

type RepoLogicConfig = {
    provider: string;
    username: string;
    reponame: string;
    branch?: string;
    path?: string;
};

export function useRepositoryViewLogic({
    provider,
    username,
    reponame,
    branch: inputBranch,
    path = "",
}: RepoLogicConfig) {
    const { data: repository, isLoading: loadingRepo, error: errorRepo } =
        useRepository(provider, username, reponame);

    const branch =
        inputBranch ?? repository?.data?.repository?.defaultBranchRef?.name;

    const { data: repositoryContent, isLoading: loadingContent } =
        useRepositoryContents(provider, username, reponame, branch, path);

    const { data: contributors, isLoading: loadingContributors } =
        useContributors(provider, username, reponame, !!branch);

    const { data: branchCommits, isLoading: loadingCommits } =
        useBranchCommits(provider, username, reponame, branch);

    const hasGitmodules = repositoryContent?.data?.repository?.object?.entries?.some(
        (e) => e.name === ".gitmodules"
    );

    const { data: gitmodulesRaw } = useGitmodules(
        provider,
        username,
        reponame,
        branch,
        hasGitmodules
    );

    const hasFork = !!(repository?.data?.repository?.isFork &&
        repository?.data.repository?.parent);

    const [parentOwner, parentRepo] =
        repository?.data?.repository?.parent?.nameWithOwner?.split("/") ?? ["", ""];

    const parentBranch =
        repository?.data?.repository?.parent?.defaultBranchRef?.name ?? "";

    const { data: forkContent } = useCommitCompare(
        provider,
        parentOwner,
        parentRepo,
        parentBranch,
        username,
        reponame,
        branch ?? "",
        hasFork
    );

    const submodules = useMemo(() => {
        if (!gitmodulesRaw) return {};
        try {
            const decoded = decodeBase64(gitmodulesRaw);
            return parseGitmodules(decoded);
        } catch (err) {
            console.warn("Error parsing .gitmodules:", err);
            return {};
        }
    }, [gitmodulesRaw]);

    const initialEntries = useMemo(() => {
        return repositoryContent?.data?.repository?.object?.entries ?? [];
    }, [repositoryContent]);

    const {
        entries,
        isLoading: isEnriching,
        hasIncomplete,
    } = useRepositoryCommitLoader(
        provider,
        username,
        reponame,
        branch!,
        initialEntries,
        40
    );

    return {
        initialEntries,
        branch,
        path,
        loadingRepo,
        errorRepo,
        loadingContent,
        loadingContributors,
        loadingCommits,
        repository,
        repositoryContent,
        contributors,
        branchCommits,
        forkContent,
        submodules,
        entries,
        isEnriching,
        hasIncomplete,
        hasFork,
        parentOwner,
        parentRepo,
        parentBranch,
    };
}
