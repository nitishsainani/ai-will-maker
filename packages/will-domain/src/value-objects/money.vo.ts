import { DomainError, Result, domainError, fail, ok } from '@will-maker/shared-kernel';

const ISO_CURRENCY = /^[A-Z]{3}$/;

export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Result<Money, DomainError> {
    if (amount < 0 || !Number.isFinite(amount)) {
      return fail(domainError('INVALID_MONEY', 'Amount must be a non-negative finite number', { amount }));
    }
    const normalizedCurrency = currency.toUpperCase();
    if (!ISO_CURRENCY.test(normalizedCurrency)) {
      return fail(domainError('INVALID_MONEY', 'Currency must be a 3-letter ISO 4217 code', { currency }));
    }
    return ok(new Money(Math.round(amount * 100) / 100, normalizedCurrency));
  }

  static reconstitute(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
