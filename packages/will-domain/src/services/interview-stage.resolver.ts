import { Beneficiary } from '../entities/beneficiary.entity';
import { Will } from '../entities/will.entity';
import { InterviewStage } from '../enums';
import { MIN_WITNESSES } from '../validation/validation-utils';
export type InterviewCheckpoints = Record<string, boolean>;

export interface StageContext {
  stage: InterviewStage;
  question: string;
  topicKey: string;
  context?: Record<string, string>;
}

export class InterviewStageResolver {
  getPendingBeneficiary(will: Will): Beneficiary | undefined {
    return will.beneficiaries.find((b) => b.relationship === 'unspecified');
  }

  hasCompleteBeneficiary(will: Will): boolean {
    return will.beneficiaries.some((b) => b.relationship !== 'unspecified');
  }

  hasMinorBeneficiaries(will: Will): boolean {
    return will.beneficiaries.some((b) => b.isMinor());
  }

  getMinorBeneficiariesWithoutGuardian(will: Will): Beneficiary[] {
    const guardedWardIds = new Set(will.guardians.map((g) => g.wardBeneficiaryId as string));
    return will.beneficiaries.filter((b) => b.isMinor() && !guardedWardIds.has(b.id as string));
  }

  isBeneficiaryPhaseComplete(will: Will, checkpoints: InterviewCheckpoints): boolean {
    return this.hasCompleteBeneficiary(will) && checkpoints.beneficiaries === true;
  }

  isAssetPhaseComplete(_will: Will, checkpoints: InterviewCheckpoints): boolean {
    return checkpoints.assets === true;
  }

  isAssetAllocationPhaseComplete(will: Will, checkpoints: InterviewCheckpoints): boolean {
    if (will.assets.length === 0 || checkpoints.assets === true) {
      return true;
    }
    return will.assets.every((asset) =>
      will.assetAllocations.some((alloc) => alloc.assetId === asset.id),
    );
  }

  isGuardianPhaseComplete(will: Will, checkpoints: InterviewCheckpoints): boolean {
    if (!this.hasMinorBeneficiaries(will)) return true;
    if (checkpoints.guardians === true) return true;
    return this.getMinorBeneficiariesWithoutGuardian(will).length === 0;
  }

  resolveStage(will: Will, checkpoints: InterviewCheckpoints = {}): InterviewStage {
    if (!will.testatorName?.trim()) {
      return InterviewStage.TESTATOR_DETAILS;
    }

    if (!this.isBeneficiaryPhaseComplete(will, checkpoints)) {
      return InterviewStage.BENEFICIARIES;
    }

    if (!this.isAssetPhaseComplete(will, checkpoints)) {
      return InterviewStage.ASSETS;
    }

    if (!this.isAssetAllocationPhaseComplete(will, checkpoints)) {
      return InterviewStage.ASSET_ALLOCATIONS;
    }

    if (will.executors.length === 0) {
      return InterviewStage.EXECUTOR;
    }

    if (!this.isGuardianPhaseComplete(will, checkpoints)) {
      return InterviewStage.GUARDIAN;
    }

    if (will.witnesses.length < MIN_WITNESSES) {
      return InterviewStage.WITNESSES;
    }

    if (checkpoints.review === true) {
      return InterviewStage.COMPLETE;
    }

    return InterviewStage.REVIEW;
  }

  canAdvanceStage(will: Will, stage: InterviewStage, checkpoints: InterviewCheckpoints = {}): boolean {
    switch (stage) {
      case InterviewStage.TESTATOR_DETAILS:
        return Boolean(will.testatorName?.trim());
      case InterviewStage.BENEFICIARIES:
        return this.isBeneficiaryPhaseComplete(will, checkpoints);
      case InterviewStage.ASSETS:
        return this.isAssetPhaseComplete(will, checkpoints);
      case InterviewStage.ASSET_ALLOCATIONS:
        return this.isAssetAllocationPhaseComplete(will, checkpoints);
      case InterviewStage.EXECUTOR:
        return will.executors.length >= 1;
      case InterviewStage.GUARDIAN:
        return this.isGuardianPhaseComplete(will, checkpoints);
      case InterviewStage.WITNESSES:
        return will.witnesses.length >= MIN_WITNESSES;
      case InterviewStage.REVIEW:
        return checkpoints.review === true;
      case InterviewStage.COMPLETE:
        return true;
      default:
        return false;
    }
  }

  getStageContext(will: Will, checkpoints: InterviewCheckpoints = {}): StageContext {
    const stage = this.resolveStage(will, checkpoints);

    switch (stage) {
      case InterviewStage.TESTATOR_DETAILS:
        return {
          stage,
          topicKey: 'testator.name',
          question: 'What is your full legal name as it should appear on your will?',
        };

      case InterviewStage.BENEFICIARIES: {
        const pending = this.getPendingBeneficiary(will);
        if (pending) {
          return {
            stage,
            topicKey: 'beneficiary.relationship',
            question: `What is your relationship to ${pending.fullName}?`,
            context: { beneficiaryName: pending.fullName },
          };
        }
        if (!this.hasCompleteBeneficiary(will)) {
          return {
            stage,
            topicKey: 'beneficiary.name',
            question: 'What is the full legal name of a beneficiary?',
          };
        }
        return {
          stage,
          topicKey: 'beneficiary.name',
          question:
            'Do you want to add another beneficiary? Enter their full legal name, or reply "done" to continue.',
        };
      }

      case InterviewStage.ASSETS:
        if (will.assets.length === 0) {
          return {
            stage,
            topicKey: 'asset.description',
            question:
              'What asset would you like to include? Describe it, or reply "none" to skip.',
          };
        }
        return {
          stage,
          topicKey: 'asset.description',
          question:
            'Do you want to add another asset? Describe the asset, or reply "done" to continue.',
        };

      case InterviewStage.ASSET_ALLOCATIONS:
        return {
          stage,
          topicKey: 'asset.allocation',
          question:
            'How should your assets be allocated among beneficiaries? Specify asset, beneficiary, and percentage.',
        };

      case InterviewStage.EXECUTOR:
        return {
          stage,
          topicKey: 'executor.name',
          question:
            'Who would you like to appoint as the primary executor of your will? Please provide their full legal name.',
        };

      case InterviewStage.GUARDIAN:
        return {
          stage,
          topicKey: 'guardian.appoint',
          question:
            'A minor beneficiary needs a guardian. Who should serve as guardian for the minor child? Reply with ward and guardian names, or "none" to skip if not applicable.',
        };

      case InterviewStage.WITNESSES: {
        const order = will.witnesses.length + 1;
        return {
          stage,
          topicKey: `witness.${order}`,
          question:
            order === 1
              ? 'Who will serve as the first witness? Provide full legal name and full address (street, city, state).'
              : 'Who will serve as the second witness? Provide full legal name and full address (street, city, state).',
          context: { witnessOrder: String(order) },
        };
      }

      case InterviewStage.REVIEW:
        return {
          stage,
          topicKey: 'review',
          question:
            'We have collected the core information. Would you like to review or add anything else?',
        };

      case InterviewStage.COMPLETE:
        return {
          stage,
          topicKey: 'complete',
          question: 'Your will interview is complete. You may now review and submit your will.',
        };
    }
  }

  toTopicPrefix(topicKey: string): string {
    if (topicKey === 'testator.name') return 'testator.name';
    if (topicKey.startsWith('beneficiary.')) return 'beneficiary.';
    if (topicKey.startsWith('executor.')) return 'executor.';
    if (topicKey.startsWith('asset.')) return 'asset.';
    if (topicKey.startsWith('guardian.')) return 'guardian.';
    if (topicKey.startsWith('witness.')) return 'witness.';
    return topicKey;
  }
}
