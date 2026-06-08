import { WillId } from '@will-maker/shared-kernel';

export interface BeneficiarySnapshot {
  id: string;
  fullName: string;
  relationship: string;
  priorityOrder: number;
  dateOfBirth?: string;
}

export interface AssetSnapshot {
  id: string;
  type: string;
  description: string;
  estimatedValue?: number;
  currency: string;
}

export interface AssetAllocationSnapshot {
  id: string;
  assetId: string;
  beneficiaryId: string;
  sharePct: number;
}

export interface ExecutorSnapshot {
  id: string;
  fullName: string;
  email?: string;
  isPrimary: boolean;
  order: number;
}

export interface GuardianSnapshot {
  id: string;
  wardBeneficiaryId: string;
  fullName: string;
  relationship: string;
}

export interface WitnessSnapshot {
  id: string;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  witnessOrder: number;
}

export class WillSnapshot {
  private constructor(
    readonly willId: WillId,
    readonly revision: number,
    readonly status: 'FINALIZED',
    readonly testatorName: string,
    readonly beneficiaries: BeneficiarySnapshot[],
    readonly assets: AssetSnapshot[],
    readonly assetAllocations: AssetAllocationSnapshot[],
    readonly executors: ExecutorSnapshot[],
    readonly guardians: GuardianSnapshot[],
    readonly witnesses: WitnessSnapshot[],
    readonly capturedAt: Date,
  ) {}

  static create(props: {
    willId: WillId;
    revision: number;
    testatorName: string;
    beneficiaries: BeneficiarySnapshot[];
    assets: AssetSnapshot[];
    assetAllocations: AssetAllocationSnapshot[];
    executors: ExecutorSnapshot[];
    guardians: GuardianSnapshot[];
    witnesses: WitnessSnapshot[];
  }): WillSnapshot {
    return new WillSnapshot(
      props.willId,
      props.revision,
      'FINALIZED',
      props.testatorName,
      props.beneficiaries,
      props.assets,
      props.assetAllocations,
      props.executors,
      props.guardians,
      props.witnesses,
      new Date(),
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      willId: this.willId,
      revision: this.revision,
      status: this.status,
      testatorName: this.testatorName,
      beneficiaries: this.beneficiaries,
      assets: this.assets,
      assetAllocations: this.assetAllocations,
      executors: this.executors,
      guardians: this.guardians,
      witnesses: this.witnesses,
      capturedAt: this.capturedAt.toISOString(),
    };
  }
}
