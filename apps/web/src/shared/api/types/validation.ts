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
