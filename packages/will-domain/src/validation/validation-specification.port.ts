import { Will } from '../entities/will.entity';

export type IssueCategory = 'completion' | 'error' | 'warning';
export type ValidationProfile = 'review' | 'finalize';

export interface ValidationIssue {
  code: string;
  message: string;
  category: IssueCategory;
  metadata?: Record<string, unknown>;
}

export interface ValidationReport {
  isValid: boolean;
  completionIssues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationSpecification {
  readonly code: string;
  isSatisfiedBy(will: Will): boolean;
  getIssues(will: Will): ValidationIssue[];
  appliesTo(profile: ValidationProfile): boolean;
}
