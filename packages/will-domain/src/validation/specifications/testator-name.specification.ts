import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles } from '../validation-utils';

export class TestatorNameSpecification implements ValidationSpecification {
  readonly code = 'R-009';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return Boolean(will.testatorName?.trim());
  }

  getIssues(will: Will): ValidationIssue[] {
    if (this.isSatisfiedBy(will)) {
      return [];
    }

    return [
      {
        code: this.code,
        message: 'Testator name is required before finalization',
        category: 'error',
      },
    ];
  }
}
