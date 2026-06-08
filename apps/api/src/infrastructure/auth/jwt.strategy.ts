import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { userId, UserId } from '@will-maker/shared-kernel';
import { UserRepository } from '@will-maker/will-domain';
import { USER_REPOSITORY } from '../../common/tokens';
import { AccessTokenPayload } from '../../application/auth/token.service.port';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AccessTokenPayload> {
    const id: UserId = userId(payload.sub);
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      sub: id,
      email: user.email.toString(),
    };
  }
}
