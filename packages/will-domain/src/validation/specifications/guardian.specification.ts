import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles } from '../validation-utils';

export class GuardianSpecification implements ValidationSpecification {
  readonly code = 'R-006';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['review', 'finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return this.getIssues(will).length === 0;
  }

  getIssues(will: Will): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const beneficiary of will.beneficiaries) {
      if (!beneficiary.isMinor()) {
        continue;
      }

      const hasGuardian = will.guardians.some(
        (g) => (g.wardBeneficiaryId as string) === (beneficiary.id as string),
      );

      if (!hasGuardian) {
        issues.push({
          code: this.code,
          message: `Minor beneficiary '${beneficiary.fullName}' has no appointed guardian`,
          category: 'error',
          metadata: {
            beneficiaryId: beneficiary.id,
            beneficiaryName: beneficiary.fullName,
          },
        });
      }
    }

    return issues;
  }
}
