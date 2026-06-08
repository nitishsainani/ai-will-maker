import { BeneficiaryId, WillId } from '@will-maker/shared-kernel';

const MINOR_AGE_THRESHOLD = 18;

export interface CreateBeneficiaryProps {
  id: BeneficiaryId;
  willId: WillId;
  fullName: string;
  relationship: string;
  priorityOrder?: number;
  dateOfBirth?: Date;
  age?: number;
  isMinor?: boolean;
  contactEmail?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
}

export class Beneficiary {
  private constructor(
    readonly id: BeneficiaryId,
    readonly willId: WillId,
    private _fullName: string,
    private _relationship: string,
    private _priorityOrder: number,
    private _dateOfBirth?: Date,
    private _age?: number,
    private _isMinor?: boolean,
    private _contactEmail?: string,
    private _addressLine1?: string,
    private _city?: string,
    private _state?: string,
  ) {}

  static create(props: CreateBeneficiaryProps): Beneficiary {
    return new Beneficiary(
      props.id,
      props.willId,
      props.fullName.trim(),
      props.relationship.trim(),
      props.priorityOrder ?? 0,
      props.dateOfBirth,
      props.age,
      props.isMinor,
      props.contactEmail?.trim(),
      props.addressLine1?.trim(),
      props.city?.trim(),
      props.state?.trim(),
    );
  }

  static reconstitute(props: CreateBeneficiaryProps): Beneficiary {
    return Beneficiary.create(props);
  }

  get fullName(): string {
    return this._fullName;
  }

  get relationship(): string {
    return this._relationship;
  }

  get priorityOrder(): number {
    return this._priorityOrder;
  }

  get dateOfBirth(): Date | undefined {
    return this._dateOfBirth;
  }

  get age(): number | undefined {
    return this._age;
  }

  get isMinorDeclared(): boolean | undefined {
    return this._isMinor;
  }

  get contactEmail(): string | undefined {
    return this._contactEmail;
  }

  get addressLine1(): string | undefined {
    return this._addressLine1;
  }

  get city(): string | undefined {
    return this._city;
  }

  get state(): string | undefined {
    return this._state;
  }

  rename(fullName: string): void {
    this._fullName = fullName.trim();
  }

  updateRelationship(relationship: string): void {
    this._relationship = relationship.trim();
  }

  setPriorityOrder(order: number): void {
    this._priorityOrder = order;
  }

  setDateOfBirth(dateOfBirth: Date): void {
    this._dateOfBirth = dateOfBirth;
  }

  setAge(age: number | undefined): void {
    this._age = age;
  }

  setIsMinor(isMinor: boolean | undefined): void {
    this._isMinor = isMinor;
  }

  updateContact(contactEmail?: string, addressLine1?: string, city?: string, state?: string): void {
    if (contactEmail !== undefined) this._contactEmail = contactEmail.trim() || undefined;
    if (addressLine1 !== undefined) this._addressLine1 = addressLine1.trim() || undefined;
    if (city !== undefined) this._city = city.trim() || undefined;
    if (state !== undefined) this._state = state.trim() || undefined;
  }

  isMinor(asOf: Date = new Date()): boolean {
    if (this._isMinor !== undefined) {
      return this._isMinor;
    }
    if (this._age !== undefined) {
      return this._age < MINOR_AGE_THRESHOLD;
    }
    if (!this._dateOfBirth) {
      return false;
    }
    const ageMs = asOf.getTime() - this._dateOfBirth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    return ageYears < MINOR_AGE_THRESHOLD;
  }
}
