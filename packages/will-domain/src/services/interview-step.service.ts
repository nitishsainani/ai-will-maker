import { Will } from '../entities/will.entity';
import {
  InterviewCheckpoints,
  InterviewStageResolver,
  StageContext,
} from './interview-stage.resolver';

export interface InterviewStep {
  key: string;
  question: string;
  context?: Record<string, string>;
}

export type { InterviewCheckpoints };

/**
 * Thin adapter over InterviewStageResolver for backward-compatible step keys.
 */
export class InterviewStepService {
  private readonly resolver = new InterviewStageResolver();

  getPendingBeneficiary(will: Will) {
    return this.resolver.getPendingBeneficiary(will);
  }

  hasCompleteBeneficiary(will: Will): boolean {
    return this.resolver.hasCompleteBeneficiary(will);
  }

  isBeneficiaryPhaseComplete(will: Will, checkpoints: InterviewCheckpoints): boolean {
    return this.resolver.isBeneficiaryPhaseComplete(will, checkpoints);
  }

  getCurrentStep(will: Will, checkpoints: InterviewCheckpoints = {}): InterviewStep {
    const ctx = this.resolver.getStageContext(will, checkpoints);
    return {
      key: ctx.topicKey,
      question: ctx.question,
      context: ctx.context,
    };
  }

  getStageContext(will: Will, checkpoints: InterviewCheckpoints = {}): StageContext {
    return this.resolver.getStageContext(will, checkpoints);
  }

  toTopicPrefix(stepKey: string): string {
    return this.resolver.toTopicPrefix(stepKey);
  }
}
