import { DomainError, ExecutorId, Result, WillId, domainError, fail, ok } from '@will-maker/shared-kernel';
import { Email } from '../value-objects/email.vo';

export interface CreateExecutorProps {
  id: ExecutorId;
  willId: WillId;
  fullName: string;
  email?: Email;
  isPrimary?: boolean;
  order?: number;
  relationship?: string;
  address?: string;
}

export class Executor {
  private constructor(
    readonly id: ExecutorId,
    readonly willId: WillId,
    private _fullName: string,
    private _email: Email | undefined,
    private _isPrimary: boolean,
    private _order: number,
    private _relationship?: string,
    private _address?: string,
  ) {}

  static create(props: CreateExecutorProps): Executor {
    return new Executor(
      props.id,
      props.willId,
      props.fullName.trim(),
      props.email,
      props.isPrimary ?? false,
      props.order ?? 0,
      props.relationship?.trim(),
      props.address?.trim(),
    );
  }

  static reconstitute(props: CreateExecutorProps): Executor {
    return Executor.create(props);
  }

  get fullName(): string {
    return this._fullName;
  }

  get email(): Email | undefined {
    return this._email;
  }

  get isPrimary(): boolean {
    return this._isPrimary;
  }

  get order(): number {
    return this._order;
  }

  get relationship(): string | undefined {
    return this._relationship;
  }

  get address(): string | undefined {
    return this._address;
  }

  rename(fullName: string): void {
    this._fullName = fullName.trim();
  }

  updateEmail(email: Email): void {
    this._email = email;
  }

  markPrimary(): void {
    this._isPrimary = true;
  }

  demote(): void {
    this._isPrimary = false;
  }

  setOrder(order: number): void {
    this._order = order;
  }

  updateRelationship(relationship: string | undefined): void {
    this._relationship = relationship?.trim() || undefined;
  }

  updateAddress(address: string | undefined): void {
    this._address = address?.trim() || undefined;
  }

  validatePrimaryState(allExecutors: Executor[]): Result<void, DomainError> {
    const primaryCount = allExecutors.filter((e) => e.isPrimary).length;
    if (primaryCount > 1) {
      return fail(domainError('DUPLICATE_PRIMARY_EXECUTOR', 'Only one primary executor is allowed'));
    }
    return ok(undefined);
  }
}
