import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles, normalizeName } from '../validation-utils';

export class DuplicateBeneficiaryNameSpecification implements ValidationSpecification {
  readonly code = 'R-004-warn';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['review', 'finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    const names = will.beneficiaries.map((b) => normalizeName(b.fullName));
    return new Set(names).size === names.length;
  }

  getIssues(will: Will): ValidationIssue[] {
    if (this.isSatisfiedBy(will)) {
      return [];
    }

    return [
      {
        code: this.code,
        message: 'Duplicate beneficiary names detected',
        category: 'warning',
      },
    ];
  }
}
