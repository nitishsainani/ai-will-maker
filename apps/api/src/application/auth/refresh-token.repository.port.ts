import { UserId } from '@will-maker/shared-kernel';

export interface RefreshTokenRepository {
  save(userId: UserId, tokenHash: string, expiresAt: Date): Promise<void>;
  findValid(userId: UserId, tokenHash: string): Promise<boolean>;
  revokeByHash(userId: UserId, tokenHash: string): Promise<void>;
  revokeAllForUser(userId: UserId): Promise<void>;
  parseRefreshExpiry(expiresIn: string): Date;
}
