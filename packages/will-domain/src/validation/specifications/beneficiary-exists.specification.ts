import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles } from '../validation-utils';

export class BeneficiaryExistsSpecification implements ValidationSpecification {
  readonly code = 'R-001';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['review', 'finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return will.beneficiaries.length >= 1;
  }

  getIssues(will: Will): ValidationIssue[] {
    if (this.isSatisfiedBy(will)) {
      return [];
    }

    return [
      {
        code: this.code,
        message: 'At least one beneficiary is required',
        category: 'completion',
      },
    ];
  }
}
