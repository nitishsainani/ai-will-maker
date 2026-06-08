import {
  AssetAllocationId,
  AssetId,
  BeneficiaryId,
  DomainError,
  Result,
  WillId,
  fail,
  ok,
} from '@will-maker/shared-kernel';
import { SharePct } from '../value-objects/share-pct.vo';

export interface CreateAssetAllocationProps {
  id: AssetAllocationId;
  willId: WillId;
  assetId: AssetId;
  beneficiaryId: BeneficiaryId;
  sharePct: SharePct;
}

export class AssetAllocation {
  private constructor(
    readonly id: AssetAllocationId,
    readonly willId: WillId,
    readonly assetId: AssetId,
    readonly beneficiaryId: BeneficiaryId,
    private _sharePct: SharePct,
  ) {}

  static create(props: CreateAssetAllocationProps): Result<AssetAllocation, DomainError> {
    return ok(new AssetAllocation(props.id, props.willId, props.assetId, props.beneficiaryId, props.sharePct));
  }

  static reconstitute(props: CreateAssetAllocationProps): AssetAllocation {
    return new AssetAllocation(props.id, props.willId, props.assetId, props.beneficiaryId, props.sharePct);
  }

  get sharePct(): SharePct {
    return this._sharePct;
  }

  updateShare(sharePct: SharePct): void {
    this._sharePct = sharePct;
  }

  matches(assetId: AssetId, beneficiaryId: BeneficiaryId): boolean {
    return this.assetId === assetId && this.beneficiaryId === beneficiaryId;
  }
}
