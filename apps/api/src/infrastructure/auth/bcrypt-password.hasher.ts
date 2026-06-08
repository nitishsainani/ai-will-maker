import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/auth/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds: number;

  constructor(private readonly config: ConfigService) {
    const configured = Number(this.config.get('BCRYPT_ROUNDS', 12));
    this.rounds = Number.isFinite(configured) && configured > 0 ? configured : 12;
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
