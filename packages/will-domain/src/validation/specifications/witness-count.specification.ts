import { Will } from '../../entities/will.entity';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { MIN_WITNESSES, appliesToProfiles } from '../validation-utils';

export class WitnessCountSpecification implements ValidationSpecification {
  readonly code = 'R-008';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return this.getIssues(will).length === 0;
  }

  getIssues(will: Will): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (will.witnesses.length < MIN_WITNESSES) {
      issues.push({
        code: 'R-008',
        message: `At least ${MIN_WITNESSES} witnesses are required`,
        category: 'error',
        metadata: { witnessCount: will.witnesses.length },
      });
    }

    const witnessOrders = new Set(will.witnesses.map((w) => w.witnessOrder));
    if (witnessOrders.size !== will.witnesses.length) {
      issues.push({
        code: 'R-008a',
        message: 'Witness orders must be unique',
        category: 'error',
      });
    }

    return issues;
  }
}
