import {
  BeneficiaryId,
  DomainError,
  GuardianId,
  Result,
  WillId,
  domainError,
  fail,
  ok,
} from '@will-maker/shared-kernel';
import { Beneficiary } from './beneficiary.entity';

export interface CreateGuardianProps {
  id: GuardianId;
  willId: WillId;
  wardBeneficiaryId: BeneficiaryId;
  fullName: string;
  relationship: string;
  address?: string;
}

export class Guardian {
  private constructor(
    readonly id: GuardianId,
    readonly willId: WillId,
    readonly wardBeneficiaryId: BeneficiaryId,
    private _fullName: string,
    private _relationship: string,
    private _address?: string,
  ) {}

  static forWard(ward: Beneficiary, props: Omit<CreateGuardianProps, 'wardBeneficiaryId' | 'willId'>): Result<Guardian, DomainError> {
    if (!ward.isMinor()) {
      return fail(
        domainError('INVALID_GUARDIAN', 'Guardian can only be appointed for a minor beneficiary', {
          beneficiaryId: ward.id,
        }),
      );
    }
    return ok(
      new Guardian(
        props.id,
        ward.willId,
        ward.id,
        props.fullName.trim(),
        props.relationship.trim(),
        props.address?.trim(),
      ),
    );
  }

  static create(props: CreateGuardianProps): Guardian {
    return new Guardian(
      props.id,
      props.willId,
      props.wardBeneficiaryId,
      props.fullName.trim(),
      props.relationship.trim(),
      props.address?.trim(),
    );
  }

  static reconstitute(props: CreateGuardianProps): Guardian {
    return Guardian.create(props);
  }

  get fullName(): string {
    return this._fullName;
  }

  get relationship(): string {
    return this._relationship;
  }

  get address(): string | undefined {
    return this._address;
  }

  rename(fullName: string): void {
    this._fullName = fullName.trim();
  }

  updateRelationship(relationship: string): void {
    this._relationship = relationship.trim();
  }

  updateAddress(address: string | undefined): void {
    this._address = address?.trim() || undefined;
  }
}
