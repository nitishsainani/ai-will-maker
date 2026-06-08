import { z } from 'zod';

export const INTERVIEW_DRAFT_METADATA_KEY = 'interviewDraft';

export const AssetTypeSchema = z.enum([
  'BANK_ACCOUNT',
  'JEWELLERY',
  'VEHICLE',
  'PROPERTY',
  'INVESTMENT',
  'OTHER',
]);

export const TestatorDraftSchema = z
  .object({
    fullName: z.string().optional(),
    age: z.number().optional(),
    address: z.string().optional(),
    soundMindDeclaration: z.boolean().optional(),
  })
  .strict();

export const RevocationDraftSchema = z
  .object({
    revokesPreviousWills: z.boolean().optional(),
  })
  .strict();

export const BeneficiaryDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    fullName: z.string().optional(),
    relationship: z.string().optional(),
    age: z.number().optional(),
    isMinor: z.boolean().optional(),
    dateOfBirth: z.string().optional(),
    contactEmail: z.string().optional(),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .strict();

export const AssetDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    assetType: AssetTypeSchema.optional(),
    description: z.string().optional(),
    estimatedValue: z.number().optional(),
    currency: z.string().optional(),
    locationOrIdentifier: z.string().optional(),
  })
  .strict();

export const AssetAllocationDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    assetId: z.string().uuid().optional(),
    beneficiaryId: z.string().uuid().optional(),
    sharePct: z.number().optional(),
  })
  .strict();

export const ExecutorDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    fullName: z.string().optional(),
    relationship: z.string().optional(),
    address: z.string().optional(),
    email: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict();

export const GuardianDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    wardBeneficiaryId: z.string().uuid().optional(),
    wardName: z.string().optional(),
    fullName: z.string().optional(),
    relationship: z.string().optional(),
    address: z.string().optional(),
  })
  .strict();

export const WitnessDraftSchema = z
  .object({
    id: z.string().uuid().optional(),
    fullName: z.string().optional(),
    address: z.string().optional(),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    isBeneficiary: z.boolean().optional(),
    witnessOrder: z.number().int().min(1).max(2).optional(),
  })
  .strict();

export const ExecutionDetailsDraftSchema = z
  .object({
    date: z.string().optional(),
    place: z.string().optional(),
    testatorSignatureLine: z.boolean().optional(),
    witnessSignatureLines: z.boolean().optional(),
  })
  .strict();

export const WillInterviewDraftSchema = z
  .object({
    testator: TestatorDraftSchema.optional(),
    revocation: RevocationDraftSchema.optional(),
    beneficiaries: z.array(BeneficiaryDraftSchema).default([]),
    assets: z.array(AssetDraftSchema).default([]),
    assetAllocations: z.array(AssetAllocationDraftSchema).default([]),
    executor: ExecutorDraftSchema.optional(),
    guardian: GuardianDraftSchema.optional(),
    witnesses: z.array(WitnessDraftSchema).default([]),
    executionDetails: ExecutionDetailsDraftSchema.optional(),
  })
  .strict();

export type WillInterviewDraft = z.infer<typeof WillInterviewDraftSchema>;
export type BeneficiaryDraft = z.infer<typeof BeneficiaryDraftSchema>;
export type AssetDraft = z.infer<typeof AssetDraftSchema>;
export type AssetAllocationDraft = z.infer<typeof AssetAllocationDraftSchema>;
export type ExecutorDraft = z.infer<typeof ExecutorDraftSchema>;
export type GuardianDraft = z.infer<typeof GuardianDraftSchema>;
export type WitnessDraft = z.infer<typeof WitnessDraftSchema>;

export const EMPTY_WILL_INTERVIEW_DRAFT: WillInterviewDraft = {
  beneficiaries: [],
  assets: [],
  assetAllocations: [],
  witnesses: [],
};
