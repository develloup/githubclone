import { PageInfoNext } from "./typesPageInfo";


type RepositoryBranchNode = {
  name: string;
  target: {
    committedDate: string;
    checkSuites: {
      nodes: {
        status: string;
        conclusion: string;
      }[];
    };
    associatedPullRequests: {
      totalCount: number;
    };
  };
};

type RepositoryBranchProtectionRule = {
  pattern: string;
  requiresApprovingReviews: boolean;
  requiredApprovingReviewCount: number;
  isAdminEnforced: boolean;
};

type RepositoryBranchInfo = {
  repository: {
    refs: {
      pageInfo: PageInfoNext;
      nodes: RepositoryBranchNode[];
    };
    branchProtectionRules: {
      nodes: RepositoryBranchProtectionRule;
    };
  };
};

type OAuthRepositoryBranchInfo = {
  data: RepositoryBranchInfo;
}

export type { OAuthRepositoryBranchInfo, RepositoryBranchInfo, RepositoryBranchNode, RepositoryBranchProtectionRule };
