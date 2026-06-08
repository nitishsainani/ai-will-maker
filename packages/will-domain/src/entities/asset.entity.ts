import { AssetId, DomainError, Result, WillId, domainError, fail, ok } from '@will-maker/shared-kernel';
import { AssetType } from '../enums';
import { Money } from '../value-objects/money.vo';

export interface CreateAssetProps {
  id: AssetId;
  willId: WillId;
  type: AssetType;
  description: string;
  /** Exact phrase the user provided (e.g. "House") before AI categorization. */
  userLabel?: string;
  estimatedValue?: Money;
  locationOrAccountDetails?: string;
}

export class Asset {
  private constructor(
    readonly id: AssetId,
    readonly willId: WillId,
    private _type: AssetType,
    private _description: string,
    private _userLabel?: string,
    private _estimatedValue?: Money,
    private _locationOrAccountDetails?: string,
  ) {}

  static create(props: CreateAssetProps): Asset {
    return new Asset(
      props.id,
      props.willId,
      props.type,
      props.description.trim(),
      props.userLabel?.trim(),
      props.estimatedValue,
      props.locationOrAccountDetails?.trim(),
    );
  }

  static reconstitute(props: CreateAssetProps): Asset {
    return Asset.create(props);
  }

  get type(): AssetType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get userLabel(): string | undefined {
    return this._userLabel;
  }

  get estimatedValue(): Money | undefined {
    return this._estimatedValue;
  }

  get locationOrAccountDetails(): string | undefined {
    return this._locationOrAccountDetails;
  }

  updateDescription(description: string): void {
    this._description = description.trim();
  }

  updateUserLabel(userLabel: string | undefined): void {
    this._userLabel = userLabel?.trim() || undefined;
  }

  updateLocationOrAccountDetails(details: string | undefined): void {
    this._locationOrAccountDetails = details?.trim() || undefined;
  }

  revalue(money: Money): Result<void, DomainError> {
    if (!this._estimatedValue || money.currency === this._estimatedValue.currency) {
      this._estimatedValue = money;
      return ok(undefined);
    }
    return fail(
      domainError('INVALID_MONEY', 'Cannot change currency of an existing asset valuation', {
        existing: this._estimatedValue.currency,
        requested: money.currency,
      }),
    );
  }

  changeType(type: AssetType): void {
    this._type = type;
  }
}
