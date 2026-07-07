export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};
