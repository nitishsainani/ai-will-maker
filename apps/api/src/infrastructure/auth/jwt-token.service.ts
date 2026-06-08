import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { userId, UserId } from '@will-maker/shared-kernel';
import {
  AccessTokenPayload,
  IssuedTokens,
  RefreshTokenPayload,
  TokenService,
} from '../../application/auth/token.service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessExpiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    this.refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  async issueTokenPair(id: UserId, email: string): Promise<IssuedTokens> {
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: id as string, email },
        { expiresIn: this.accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` },
      ),
      this.jwtService.signAsync(
        { sub: id as string, jti },
        { expiresIn: this.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessExpiresIn,
      refreshTokenExpiresIn: this.refreshExpiresIn,
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token);
      return {
        sub: userId(payload.sub),
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = this.jwtService.verify<{ sub: string; jti: string }>(token);
      return {
        sub: userId(payload.sub),
        jti: payload.jti,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
