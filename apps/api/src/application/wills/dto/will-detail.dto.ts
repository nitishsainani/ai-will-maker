import { WillStatus } from '@will-maker/will-domain';

export interface BeneficiaryDto {
  id: string;
  fullName: string;
  relationship: string;
  priorityOrder: number;
  dateOfBirth?: string;
}

export interface AssetDto {
  id: string;
  type: string;
  description: string;
  estimatedValue?: number;
  currency: string;
}

export interface AssetAllocationDto {
  id: string;
  assetId: string;
  beneficiaryId: string;
  sharePct: number;
}

export interface ExecutorDto {
  id: string;
  fullName: string;
  email?: string;
  isPrimary: boolean;
  order: number;
}

export interface GuardianDto {
  id: string;
  wardBeneficiaryId: string;
  fullName: string;
  relationship: string;
}

export interface WitnessDto {
  id: string;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  witnessOrder: number;
}

export interface WillSummaryDto {
  id: string;
  title: string;
  status: WillStatus;
  revision: number;
  testatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WillDetailDto extends WillSummaryDto {
  userId: string;
  beneficiaries: BeneficiaryDto[];
  assets: AssetDto[];
  assetAllocations: AssetAllocationDto[];
  executors: ExecutorDto[];
  guardians: GuardianDto[];
  witnesses: WitnessDto[];
}
