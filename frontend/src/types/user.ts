export type User = {
  id: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
