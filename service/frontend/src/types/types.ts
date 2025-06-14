
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

type RepositoryLanguageEdge = {
  size: number;
  node: RepositoryLanguage;
};

type RepositoryLanguages = {
  totalSize: number;
  edges: RepositoryLanguageEdge[];
};

type RepositoryBranchNode = {
  name: string;
};

type RepositoryBranches = {
  totalCount: number;
  nodes: RepositoryBranchNode[];
};

type RepositoryTagNode = {
  name: string;
};

type RepositoryTags = {
  totalCount: number;
  nodes: RepositoryTagNode[];
};

type RepositoryReleases = {
  totalCount: number;
};

type RepositoryLicenseInfo = {
  key: string;
  name: string;
  nickname: string;
};

type RepositoryWatchers = {
  totalCount: number;
};

type RepositoryOwner = {
  avatarUrl: string;
};

type RepositoryDefaultBranchRef = {
  name: string;
};

type ExtendedRepository = {
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
  languages: RepositoryLanguages;
  defaultBranchRef: RepositoryDefaultBranchRef;
  branches: RepositoryBranches;
  tags: RepositoryTags;
  releases: RepositoryReleases;
  licenseInfo: RepositoryLicenseInfo | null;
  watchers: RepositoryWatchers;
};


type OAuthRepository = {
  data: {
    repository: ExtendedRepository;
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
export type { ExtendedRepository, RepositoryOwner, RepositoryLanguage, RepositoryLanguageEdge, RepositoryDefaultBranchRef, OAuthRepository };
export type { RepositoryContents, OAuthRepositoryContents };