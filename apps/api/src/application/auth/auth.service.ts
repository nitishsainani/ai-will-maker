import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { domainError, userId, UserId } from '@will-maker/shared-kernel';
import { Email, UserRepository, User } from '@will-maker/will-domain';
import {
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../common/tokens';
import { throwFromDomainError } from '../../common/filters/domain-exception.filter';
import { PasswordHasher } from './password-hasher.port';
import { RefreshTokenRepository } from './refresh-token.repository.port';
import { TokenService } from './token.service.port';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthUserResponse {
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

export interface RefreshInput {
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokensResponse & { user: AuthUserResponse }> {
    const emailResult = Email.create(input.email);
    if (!emailResult.ok) {
      throwFromDomainError(emailResult.error);
    }

    const existing = await this.userRepository.findByEmail(emailResult.value);
    if (existing) {
      throwFromDomainError(
        domainError('VALIDATION_FAILED', 'An account with this email already exists'),
      );
    }

    const userResult = await User.register(
      {
        id: userId(randomUUID()),
        email: emailResult.value,
        passwordHash: '',
        fullName: input.fullName,
      },
      this.passwordHasher,
      input.password,
    );

    if (!userResult.ok) {
      throwFromDomainError(userResult.error);
    }

    const user = userResult.value;
    await this.userRepository.save(user);

    const tokens = await this.issueAndPersistTokens(user);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async login(input: LoginInput): Promise<AuthTokensResponse & { user: AuthUserResponse }> {
    const emailResult = Email.create(input.email);
    if (!emailResult.ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepository.findByEmail(emailResult.value);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await user.verifyPassword(input.password, this.passwordHasher);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueAndPersistTokens(user);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async refresh(input: RefreshInput): Promise<AuthTokensResponse> {
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
    const tokenHash = this.tokenService.hashRefreshToken(input.refreshToken);

    const isValid = await this.refreshTokenRepository.findValid(payload.sub, tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    await this.refreshTokenRepository.revokeByHash(payload.sub, tokenHash);

    return this.issueAndPersistTokens(user);
  }

  async logout(id: UserId, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
      await this.refreshTokenRepository.revokeByHash(id, tokenHash);
      return;
    }

    await this.refreshTokenRepository.revokeAllForUser(id);
  }

  private async issueAndPersistTokens(user: User): Promise<AuthTokensResponse> {
    const tokens = await this.tokenService.issueTokenPair(user.id, user.email.toString());
    const refreshHash = this.tokenService.hashRefreshToken(tokens.refreshToken);
    const expiresAt = this.refreshTokenRepository.parseRefreshExpiry(tokens.refreshTokenExpiresIn);

    await this.refreshTokenRepository.save(user.id, refreshHash, expiresAt);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
    };
  }

  private toAuthUser(user: User): AuthUserResponse {
    return {
      id: user.id as string,
      email: user.email.toString(),
      fullName: user.fullName,
    };
  }
}
