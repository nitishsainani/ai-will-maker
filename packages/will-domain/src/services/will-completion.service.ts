import { Will } from '../entities/will.entity';
import { InterviewStage } from '../enums';
import { InterviewCompletenessService, InterviewField } from './interview-completeness.service';
import { InterviewCheckpoints, InterviewStageResolver } from './interview-stage.resolver';
import { WillValidationService, ValidationReport } from './will-validation.service';
import { MIN_WITNESSES } from '../validation/validation-utils';

export class WillCompletionService {
  private readonly completeness = new InterviewCompletenessService();
  private readonly stageResolver = new InterviewStageResolver();
  private readonly validation = new WillValidationService();

  getMissingFields(will: Will): InterviewField[] {
    return this.completeness.getMissingFields(will);
  }

  getAllFields(will: Will): InterviewField[] {
    return this.completeness.getAllFields(will);
  }

  getValidationReport(will: Will): ValidationReport {
    return this.validation.validateForReview(will);
  }

  getFinalizeValidationReport(will: Will): ValidationReport {
    return this.validation.validateForFinalize(will);
  }

  canGenerateDocument(will: Will): boolean {
    const report = this.validation.validateForFinalize(will);
    return report.isValid;
  }

  getProgressPercent(will: Will): number {
    return this.completeness.getProgressPercent(will);
  }

  isCoreComplete(will: Will): boolean {
    return this.completeness.isComplete(will);
  }

  isInterviewComplete(will: Will, checkpoints: InterviewCheckpoints = {}): boolean {
    const stage = this.stageResolver.resolveStage(will, checkpoints);
    return (
      stage === InterviewStage.COMPLETE ||
      (stage === InterviewStage.REVIEW &&
        Boolean(will.testatorName?.trim()) &&
        will.beneficiaries.length >= 1 &&
        will.executors.length >= 1 &&
        will.witnesses.length >= MIN_WITNESSES &&
        checkpoints.review === true)
    );
  }

  canAdvanceStage(
    will: Will,
    stage: InterviewStage,
    checkpoints: InterviewCheckpoints = {},
  ): boolean {
    return this.stageResolver.canAdvanceStage(will, stage, checkpoints);
  }

  resolveStage(will: Will, checkpoints: InterviewCheckpoints = {}): InterviewStage {
    return this.stageResolver.resolveStage(will, checkpoints);
  }
}
