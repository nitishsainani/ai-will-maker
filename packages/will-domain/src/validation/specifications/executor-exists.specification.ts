import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles } from '../validation-utils';

export class ExecutorExistsSpecification implements ValidationSpecification {
  readonly code = 'R-003';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return will.executors.length >= 1;
  }

  getIssues(will: Will): ValidationIssue[] {
    if (this.isSatisfiedBy(will)) {
      return [];
    }

    return [
      {
        code: this.code,
        message: 'At least one executor is required',
        category: 'completion',
      },
    ];
  }
}
