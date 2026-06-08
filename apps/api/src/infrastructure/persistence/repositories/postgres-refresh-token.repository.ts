import { Injectable } from '@nestjs/common';
import { UserId } from '@will-maker/shared-kernel';
import { RefreshTokenRepository } from '../../../application/auth/refresh-token.repository.port';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PostgresRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: UserId, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: userId as string,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findValid(userId: UserId, tokenHash: string): Promise<boolean> {
    const row = await this.prisma.refreshToken.findFirst({
      where: {
        userId: userId as string,
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });
    return row !== null;
  }

  async revokeByHash(userId: UserId, tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: userId as string,
        tokenHash,
      },
    });
  }

  async revokeAllForUser(userId: UserId): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId: userId as string },
    });
  }

  parseRefreshExpiry(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
