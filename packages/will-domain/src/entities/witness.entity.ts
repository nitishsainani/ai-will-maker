import { DomainError, Result, WitnessId, WillId, domainError, fail, ok } from '@will-maker/shared-kernel';

const MIN_WITNESS_ORDER = 1;
const MAX_WITNESS_ORDER = 2;

export interface CreateWitnessProps {
  id: WitnessId;
  willId: WillId;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  witnessOrder: number;
  address?: string;
  isBeneficiary?: boolean;
}

export class Witness {
  private constructor(
    readonly id: WitnessId,
    readonly willId: WillId,
    private _fullName: string,
    private _addressLine1: string,
    private _city: string,
    private _state: string,
    private _witnessOrder: number,
    private _address?: string,
    private _isBeneficiary?: boolean,
  ) {}

  static create(props: CreateWitnessProps): Result<Witness, DomainError> {
    if (props.witnessOrder < MIN_WITNESS_ORDER || props.witnessOrder > MAX_WITNESS_ORDER) {
      return fail(
        domainError('VALIDATION_FAILED', `Witness order must be between ${MIN_WITNESS_ORDER} and ${MAX_WITNESS_ORDER}`, {
          witnessOrder: props.witnessOrder,
        }),
      );
    }
    return ok(
      new Witness(
        props.id,
        props.willId,
        props.fullName.trim(),
        props.addressLine1.trim(),
        props.city.trim(),
        props.state.trim(),
        props.witnessOrder,
        props.address?.trim(),
        props.isBeneficiary,
      ),
    );
  }

  static reconstitute(props: CreateWitnessProps): Witness {
    return new Witness(
      props.id,
      props.willId,
      props.fullName,
      props.addressLine1,
      props.city,
      props.state,
      props.witnessOrder,
      props.address,
      props.isBeneficiary,
    );
  }

  get fullName(): string {
    return this._fullName;
  }

  get addressLine1(): string {
    return this._addressLine1;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get witnessOrder(): number {
    return this._witnessOrder;
  }

  get address(): string | undefined {
    return this._address;
  }

  get isBeneficiary(): boolean | undefined {
    return this._isBeneficiary;
  }

  rename(fullName: string): void {
    this._fullName = fullName.trim();
  }

  updateAddress(addressLine1: string, city: string, state: string): void {
    this._addressLine1 = addressLine1.trim();
    this._city = city.trim();
    this._state = state.trim();
  }

  updateContractAddress(address: string | undefined): void {
    this._address = address?.trim() || undefined;
  }

  updateIsBeneficiary(isBeneficiary: boolean | undefined): void {
    this._isBeneficiary = isBeneficiary;
  }
}
