import { Will } from '../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationReport,
  ValidationSpecification,
} from './validation-specification.port';

export class ValidationEngine {
  constructor(private readonly specifications: readonly ValidationSpecification[]) {}

  validate(will: Will, profile: ValidationProfile): ValidationReport {
    const completionIssues: ValidationIssue[] = [];
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    for (const spec of this.specifications) {
      if (!spec.appliesTo(profile) || spec.isSatisfiedBy(will)) {
        continue;
      }

      for (const issue of spec.getIssues(will)) {
        switch (issue.category) {
          case 'completion':
            completionIssues.push(issue);
            break;
          case 'error':
            errors.push(issue);
            break;
          case 'warning':
            warnings.push(issue);
            break;
        }
      }
    }

    const isValid =
      profile === 'finalize'
        ? errors.length === 0 && completionIssues.length === 0
        : errors.length === 0;

    return { isValid, completionIssues, errors, warnings };
  }
}
