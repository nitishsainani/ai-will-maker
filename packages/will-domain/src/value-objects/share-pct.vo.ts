import { DomainError, Result, domainError, fail, ok } from '@will-maker/shared-kernel';

const MIN_SHARE = 0.01;
const MAX_SHARE = 100;
const TOLERANCE = 0.01;

export class SharePct {
  private constructor(private readonly percentage: number) {}

  static create(value: number): Result<SharePct, DomainError> {
    const rounded = Math.round(value * 100) / 100;
    if (rounded < MIN_SHARE || rounded > MAX_SHARE) {
      return fail(
        domainError('INVALID_ALLOCATION', `Share must be between ${MIN_SHARE} and ${MAX_SHARE}`, {
          value,
        }),
      );
    }
    return ok(new SharePct(rounded));
  }

  static reconstitute(value: number): SharePct {
    return new SharePct(value);
  }

  get value(): number {
    return this.percentage;
  }

  equals(other: SharePct): boolean {
    return Math.abs(this.percentage - other.percentage) < TOLERANCE;
  }

  add(other: SharePct): number {
    return Math.round((this.percentage + other.percentage) * 100) / 100;
  }
}

export function sumSharePcts(shares: SharePct[]): number {
  return shares.reduce((sum, s) => sum + s.value, 0);
}
