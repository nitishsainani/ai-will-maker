import { Will } from '../../entities/will.entity';
import { sumSharePcts } from '../../value-objects/share-pct.vo';
import {
  ValidationIssue,
  ValidationProfile,
  ValidationSpecification,
} from '../validation-specification.port';
import { ALLOCATION_TOLERANCE, appliesToProfiles } from '../validation-utils';

export class AllocationPercentageSpecification implements ValidationSpecification {
  readonly code = 'R-002';

  appliesTo(profile: ValidationProfile): boolean {
    return appliesToProfiles(profile, ['review', 'finalize']);
  }

  isSatisfiedBy(will: Will): boolean {
    return this.getIssues(will).length === 0;
  }

  getIssues(will: Will): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const assetIds = new Set(will.assets.map((a) => a.id as string));
    for (const assetId of assetIds) {
      const shares = will.assetAllocations
        .filter((a) => (a.assetId as string) === assetId)
        .map((a) => a.sharePct);

      if (shares.length === 0) {
        continue;
      }

      const total = sumSharePcts(shares);
      if (Math.abs(total - 100) > ALLOCATION_TOLERANCE) {
        issues.push({
          code: 'R-003-asset',
          message: `Asset ${assetId} share allocations must sum to 100% (got ${total}%)`,
          category: 'error',
          metadata: { assetId, total },
        });
      }
    }

    return issues;
  }
}
