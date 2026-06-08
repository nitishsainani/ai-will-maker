declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type WillId = Brand<string, 'WillId'>;
export type BeneficiaryId = Brand<string, 'BeneficiaryId'>;
export type AssetId = Brand<string, 'AssetId'>;
export type AssetAllocationId = Brand<string, 'AssetAllocationId'>;
export type ResiduaryAllocationId = Brand<string, 'ResiduaryAllocationId'>;
export type ExecutorId = Brand<string, 'ExecutorId'>;
export type GuardianId = Brand<string, 'GuardianId'>;
export type WitnessId = Brand<string, 'WitnessId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type ConversationMemoryId = Brand<string, 'ConversationMemoryId'>;
export type ConversationMessageId = Brand<string, 'ConversationMessageId'>;

export function createId<T extends string>(value: string): Brand<string, T> {
  return value as Brand<string, T>;
}

export function userId(value: string): UserId {
  return createId<'UserId'>(value);
}

export function willId(value: string): WillId {
  return createId<'WillId'>(value);
}

export function beneficiaryId(value: string): BeneficiaryId {
  return createId<'BeneficiaryId'>(value);
}

export function assetId(value: string): AssetId {
  return createId<'AssetId'>(value);
}

export function assetAllocationId(value: string): AssetAllocationId {
  return createId<'AssetAllocationId'>(value);
}

export function residuaryAllocationId(value: string): ResiduaryAllocationId {
  return createId<'ResiduaryAllocationId'>(value);
}

export function executorId(value: string): ExecutorId {
  return createId<'ExecutorId'>(value);
}

export function guardianId(value: string): GuardianId {
  return createId<'GuardianId'>(value);
}

export function witnessId(value: string): WitnessId {
  return createId<'WitnessId'>(value);
}

export function conversationId(value: string): ConversationId {
  return createId<'ConversationId'>(value);
}

export function conversationMemoryId(value: string): ConversationMemoryId {
  return createId<'ConversationMemoryId'>(value);
}

export function conversationMessageId(value: string): ConversationMessageId {
  return createId<'ConversationMessageId'>(value);
}
