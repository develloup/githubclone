type User = {
  username: string;
  email: string;
} | null;// The entries of a user

type OAuthUser = {
  data: {
    viewer: {
      login: string; // User name
      name: string; // Full name
      email: string; // Public email (if available)
      bio: string; // Description / Biography
      avatarUrl: string; // Avatar picture URL
      createdAt: string; // Account creation date
      company?: string; // Company or Organization (optional)
      location: string; // User location
      websiteUrl?: string; // Personal website (optional)
    };
  };
};

export type { User, OAuthUser };