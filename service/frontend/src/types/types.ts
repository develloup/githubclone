
type User = {
  username: string;
  email: string;
} | null;

// The entries of a user
type OAuthUser = {
  data: {
    viewer: {
      login: string;       // User name
      name: string;        // Full name
      email: string;       // Public email (if available)
      bio: string;         // Description / Biography
      avatarUrl: string;   // Avatar picture URL
      createdAt: string;   // Account creation date
      company?: string;    // Company or Organization (optional)
      location: string;    // User location
      websiteUrl?: string; // Personal website (optional)
    };
  };
};

// The entries for a single repository
type OAuthRepositoryNode = {
  name: string;
  description: string;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  stargazerCount: number;
  forkCount: number;
  provider: string; // Identification of the provider
  avatarUrl: string;   // Avatar picture URL
};

// PageInfo to handle the cursor
type OAuthPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string;
  startCursor: string;
};

// The response to a repository request
type OAuthRepositories = {
  data: {
    viewer: {
      avatarUrl: string; // Avatar picture URL
      repositories: {
        pageInfo: OAuthPageInfo;
        nodes: OAuthRepositoryNode[];
      };
    };
  };
};

type RepositoryLanguage = {
  name: string;
  color: string;
};

type LanguageEdge = {
  size: number;
  node: RepositoryLanguage;
};

type RepositoryOwner = {
  avatarUrl: string;
};

type DefaultBranchRef = {
  name: string;
};

type Repository = {
  name: string;
  description: string;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  stargazerCount: number;
  forkCount: number;
  owner: RepositoryOwner;
  defaultBranchRef: DefaultBranchRef | null;
  languages: {
    totalSize: number;
    edges: LanguageEdge[];
  };
};

type OAuthRepository = {
  data: {
    repository: Repository;
  }
};

type RepositoryContents = {
  repository: {
    object: {
      entries: {
        name: string;
        type: "blob" | "tree" | "commit"; // Git-Objekttyp
        mode: string; // z. B. "100644" für Dateien, "040000" für Verzeichnisse
      }[];
    } | null;
  } | null;
};

type OAuthRepositoryContents = {
  data: RepositoryContents
}

export type {User, OAuthUser, OAuthRepositories, OAuthRepositoryNode, OAuthPageInfo };
export type { Repository, RepositoryOwner, RepositoryLanguage, LanguageEdge, DefaultBranchRef, OAuthRepository };
export type { RepositoryContents, OAuthRepositoryContents };