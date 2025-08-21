import { useRepositoryBranches } from './useRepositoryBranches';

type RepositoryBranchesLogicConfig = {
    provider: string;
    username: string;
    reponame: string;
    tab?: string;  // optional, default "0"
    page?: string; // optional, default "1"
};

export function useRepositoryBranchLogic({
    provider,
    username,
    reponame,
    tab = "0",
    page = "1"
}: RepositoryBranchesLogicConfig) {

    const { data: branches } = useRepositoryBranches(provider, username, reponame, tab, page);

    return {
        branches
    };
}
