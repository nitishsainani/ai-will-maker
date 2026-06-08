import { Will } from '../entities/will.entity';

export interface DraftFact {
  key: string;
  value: unknown;
  confidence: number;
  source: 'database';
}

export class WillDraftSnapshotService {
  buildSnapshot(will: Will): Record<string, unknown> {
    const snapshot: Record<string, unknown> = {};

    if (will.testatorName) {
      snapshot['testator.name'] = will.testatorName;
    }

    will.beneficiaries.forEach((b, index) => {
      snapshot[`beneficiary.${index}`] = {
        fullName: b.fullName,
        relationship: b.relationship,
        priorityOrder: b.priorityOrder,
        dateOfBirth: b.dateOfBirth?.toISOString(),
      };
    });

    will.executors.forEach((e, index) => {
      snapshot[`executor.${index}`] = {
        fullName: e.fullName,
        email: e.email?.toString(),
        isPrimary: e.isPrimary,
      };
    });

    will.assets.forEach((asset, index) => {
      const allocations = will.assetAllocations
        .filter((a) => a.assetId === asset.id)
        .map((a) => {
          const beneficiary = will.beneficiaries.find((b) => b.id === a.beneficiaryId);
          return {
            beneficiaryName: beneficiary?.fullName ?? 'Unknown',
            sharePct: a.sharePct.value,
          };
        });

      snapshot[`asset.${index}`] = {
        type: asset.type,
        description: asset.description,
        estimatedValue: asset.estimatedValue?.amount,
        currency: asset.estimatedValue?.currency,
        allocations,
      };
    });

    will.guardians.forEach((g, index) => {
      const ward = will.beneficiaries.find((b) => b.id === g.wardBeneficiaryId);
      snapshot[`guardian.${index}`] = {
        wardName: ward?.fullName ?? 'Unknown',
        fullName: g.fullName,
        relationship: g.relationship,
      };
    });

    will.witnesses.forEach((w) => {
      snapshot[`witness.${w.witnessOrder - 1}`] = {
        fullName: w.fullName,
        addressLine1: w.addressLine1,
        city: w.city,
        state: w.state,
        witnessOrder: w.witnessOrder,
      };
    });

    return snapshot;
  }

  toDraftFacts(will: Will): DraftFact[] {
    return Object.entries(this.buildSnapshot(will)).map(([key, value]) => ({
      key,
      value,
      confidence: 1,
      source: 'database' as const,
    }));
  }
}
