import { useRepositoryTags } from './useRepositoryTags';

type RepositoryTagsLogicConfig = {
    provider: string;
    username: string;
    reponame: string;
    page?: string; // optional, default "1"
};

export function useRepositoryTagLogic({
    provider,
    username,
    reponame,
    page = "1"
}: RepositoryTagsLogicConfig) {

    const { data: tags } = useRepositoryTags(provider, username, reponame, page);

    return {
        tags
    };
}
