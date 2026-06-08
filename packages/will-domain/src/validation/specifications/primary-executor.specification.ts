import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles } from '../validation-utils';

export class PrimaryExecutorSpecification implements ValidationSpecification {
  readonly code = 'R-003a';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return this.getIssues(will).length === 0;
  }

  getIssues(will: Will): ValidationIssue[] {
    if (will.executors.length === 0) {
      return [];
    }

    const primaryExecutors = will.executors.filter((e) => e.isPrimary);

    if (primaryExecutors.length === 0) {
      return [
        {
          code: 'R-003a',
          message: 'A primary executor must be designated',
          category: 'error',
        },
      ];
    }

    if (primaryExecutors.length > 1) {
      return [
        {
          code: 'R-003b',
          message: 'Only one primary executor is allowed',
          category: 'error',
        },
      ];
    }

    return [];
  }
}
