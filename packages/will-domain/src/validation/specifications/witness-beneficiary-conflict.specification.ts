import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { appliesToProfiles, normalizeName } from '../validation-utils';

export class WitnessBeneficiaryConflictSpecification implements ValidationSpecification {
  readonly code = 'R-010';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return this.getIssues(will).length === 0;
  }

  getIssues(will: Will): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const beneficiaryNames = new Map(
      will.beneficiaries.map((b) => [normalizeName(b.fullName), b.fullName]),
    );

    for (const witness of will.witnesses) {
      const normalizedWitnessName = normalizeName(witness.fullName);
      const beneficiaryName = beneficiaryNames.get(normalizedWitnessName);

      if (beneficiaryName) {
        issues.push({
          code: this.code,
          message: `Witness '${witness.fullName}' is also named as a beneficiary`,
          category: 'warning',
          metadata: {
            witnessName: witness.fullName,
            beneficiaryName,
            witnessId: witness.id,
          },
        });
      }
    }

    return issues;
  }
}
