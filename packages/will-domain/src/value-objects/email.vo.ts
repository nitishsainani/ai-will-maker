import { DomainError, Result, domainError, fail, ok } from '@will-maker/shared-kernel';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Result<Email, DomainError> {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      return fail(domainError('INVALID_EMAIL', 'Invalid email address', { raw }));
    }
    return ok(new Email(normalized));
  }

  static reconstitute(value: string): Email {
    return new Email(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
