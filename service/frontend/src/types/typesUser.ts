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

type UserType = {
  userid: number
  name: string
  email: string
  description: string
}

type ConnectionType = {
  connectionid: number
  name: string
  type: string
  clientid: string
  clientsecret: string
  description: string
}

type UserConnection = {
  user_id: number
  connection_id: number
  user_name: string
  connection_name: string
}

export type { User, OAuthUser };
export type { UserType, ConnectionType, UserConnection };