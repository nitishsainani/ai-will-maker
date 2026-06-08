export type DomainErrorCode =
  | 'INVALID_ALLOCATION'
  | 'INVALID_STATUS_TRANSITION'
  | 'WILL_NOT_EDITABLE'
  | 'WILL_NOT_FOUND'
  | 'BENEFICIARY_NOT_FOUND'
  | 'ASSET_NOT_FOUND'
  | 'ALLOCATION_NOT_FOUND'
  | 'EXECUTOR_NOT_FOUND'
  | 'GUARDIAN_NOT_FOUND'
  | 'WITNESS_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'MISSING_EXECUTOR'
  | 'MISSING_BENEFICIARY'
  | 'MISSING_WITNESS'
  | 'INVALID_RESIDUARY_SUM'
  | 'INVALID_ASSET_SHARE_SUM'
  | 'INVALID_EMAIL'
  | 'INVALID_MONEY'
  | 'INVALID_GUARDIAN'
  | 'DUPLICATE_PRIMARY_EXECUTOR'
  | 'ENTITY_NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'CONCURRENCY_CONFLICT';

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export function domainError(
  code: DomainErrorCode,
  message: string,
  details?: Record<string, unknown>,
): DomainError {
  return { code, message, details };
}
