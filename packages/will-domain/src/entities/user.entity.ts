import { DomainError, Result, UserId, domainError, fail, ok } from '@will-maker/shared-kernel';
import { Email } from '../value-objects/email.vo';

export interface RegisterUserProps {
  id: UserId;
  email: Email;
  passwordHash: string;
  fullName: string;
}

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export class User {
  private constructor(
    readonly id: UserId,
    private readonly _email: Email,
    private _passwordHash: string,
    private _fullName: string,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static async register(
    props: RegisterUserProps,
    hasher: IPasswordHasher,
    plainPassword: string,
  ): Promise<Result<User, DomainError>> {
    if (plainPassword.length < 8) {
      return fail(domainError('VALIDATION_FAILED', 'Password must be at least 8 characters'));
    }
    const passwordHash = await hasher.hash(plainPassword);
    const now = new Date();
    return ok(
      new User(props.id, props.email, passwordHash, props.fullName.trim(), now, now),
    );
  }

  static reconstitute(props: RegisterUserProps & { createdAt: Date; updatedAt: Date }): User {
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      props.fullName,
      props.createdAt,
      props.updatedAt,
    );
  }

  get email(): Email {
    return this._email;
  }

  get fullName(): string {
    return this._fullName;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  async verifyPassword(plain: string, hasher: IPasswordHasher): Promise<boolean> {
    return hasher.compare(plain, this._passwordHash);
  }

  updateFullName(fullName: string): void {
    this._fullName = fullName.trim();
    this._updatedAt = new Date();
  }

  async changePassword(plain: string, hasher: IPasswordHasher): Promise<Result<void, DomainError>> {
    if (plain.length < 8) {
      return fail(domainError('VALIDATION_FAILED', 'Password must be at least 8 characters'));
    }
    this._passwordHash = await hasher.hash(plain);
    this._updatedAt = new Date();
    return ok(undefined);
  }
}
