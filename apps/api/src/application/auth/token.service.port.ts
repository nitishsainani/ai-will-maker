import { UserId } from '@will-maker/shared-kernel';

export interface AccessTokenPayload {
  sub: UserId;
  email: string;
}

export interface RefreshTokenPayload {
  sub: UserId;
  jti: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

/**
 * Application port for JWT operations.
 * Keeps AuthService independent of @nestjs/jwt internals.
 */
export interface TokenService {
  issueTokenPair(userId: UserId, email: string): Promise<IssuedTokens>;
  verifyAccessToken(token: string): AccessTokenPayload;
  verifyRefreshToken(token: string): RefreshTokenPayload;
  hashRefreshToken(token: string): string;
}
