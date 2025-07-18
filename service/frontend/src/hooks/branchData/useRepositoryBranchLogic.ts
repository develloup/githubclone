import { useRepositoryBranches } from './useRepositoryBranches';

type RepositoryBranchesLogicConfig = {
    provider: string;
    username: string;
    reponame: string;

};

export function useRepositoryBranchLogic({
    provider,
    username,
    reponame,
}: RepositoryBranchesLogicConfig) {

    const { data: branches } = useRepositoryBranches(provider, username, reponame);

    return {
        branches
    };
}
