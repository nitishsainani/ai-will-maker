export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
