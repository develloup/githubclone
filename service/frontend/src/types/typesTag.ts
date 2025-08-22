import { PageInfoNext } from "./typesPageInfo";


type RepositoryTagNode = {
    name: string;
    target: {
        committedDate: string;
    }
}

type RepositoryTagInfo = {
    repository: {
        refs: {
            pageInfo: PageInfoNext;
            nodes: RepositoryTagNode[];
        };
}   ;
}

type OAuthRepositoryTagInfo = {
    data: RepositoryTagInfo;
}

export type { OAuthRepositoryTagInfo, RepositoryTagInfo, RepositoryTagNode };