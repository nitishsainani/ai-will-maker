import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../application/auth/auth.service';
import { PASSWORD_HASHER, TOKEN_SERVICE } from '../common/tokens';
import { BcryptPasswordHasher } from '../infrastructure/auth/bcrypt-password.hasher';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { JwtTokenService } from '../infrastructure/auth/jwt-token.service';
import { AuthController } from '../presentation/auth/auth.controller';
import { PersistenceModule } from './persistence.module';
import { UsersModule } from './users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
    PersistenceModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [AuthService, PASSWORD_HASHER, TOKEN_SERVICE],
})
export class AuthModule {}
