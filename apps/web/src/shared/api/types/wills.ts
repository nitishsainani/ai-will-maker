export type WillStatus = 'DRAFT' | 'IN_REVIEW' | 'FINALIZED';

export interface WillSummary {
  id: string;
  title: string;
  status: WillStatus;
  revision: number;
  testatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Beneficiary {
  id: string;
  fullName: string;
  relationship: string;
  priorityOrder: number;
  dateOfBirth?: string;
}

export interface Asset {
  id: string;
  type: string;
  description: string;
  estimatedValue?: number;
  currency: string;
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  beneficiaryId: string;
  sharePct: number;
}

export interface Executor {
  id: string;
  fullName: string;
  email?: string;
  isPrimary: boolean;
  order: number;
}

export interface Guardian {
  id: string;
  wardBeneficiaryId: string;
  fullName: string;
  relationship: string;
}

export interface Witness {
  id: string;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  witnessOrder: number;
}

export interface WillDetail extends WillSummary {
  userId: string;
  beneficiaries: Beneficiary[];
  assets: Asset[];
  assetAllocations: AssetAllocation[];
  executors: Executor[];
  guardians: Guardian[];
  witnesses: Witness[];
}

export interface CreateWillInput {
  title: string;
  testatorName?: string;
}

export interface UpdateWillInput {
  title?: string;
  testatorName?: string;
}
