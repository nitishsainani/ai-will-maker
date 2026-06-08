import { randomUUID } from 'crypto';
import { assetId, executorId } from '@will-maker/shared-kernel';
import { describe, expect, it } from 'vitest';
import { AssetType, InterviewStage } from '../enums';
import { addTestBeneficiary, createTestWill } from '../test/will-factory';
import { InterviewStageResolver } from './interview-stage.resolver';

describe('InterviewStageResolver', () => {
  const resolver = new InterviewStageResolver();

  it('starts at TESTATOR_DETAILS when testator name is missing', () => {
    const will = createTestWill();
    expect(resolver.resolveStage(will)).toBe(InterviewStage.TESTATOR_DETAILS);
  });

  it('moves to BENEFICIARIES after testator is set', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    expect(resolver.resolveStage(will)).toBe(InterviewStage.BENEFICIARIES);
  });

  it('asks to add another beneficiary when one exists without checkpoint', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    addTestBeneficiary(will, 'John Doe', 'spouse');
    const ctx = resolver.getStageContext(will);
    expect(ctx.stage).toBe(InterviewStage.BENEFICIARIES);
    expect(ctx.question.toLowerCase()).toContain('another beneficiary');
  });

  it('advances beneficiaries phase when checkpoint is set', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    addTestBeneficiary(will, 'John Doe', 'spouse');
    expect(resolver.resolveStage(will, { beneficiaries: true })).toBe(InterviewStage.ASSETS);
  });

  it('asks to add another asset when assets exist without checkpoint', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    addTestBeneficiary(will, 'John Doe', 'spouse');
    will.addAsset({
      id: assetId(randomUUID()),
      type: AssetType.REAL_ESTATE,
      description: 'Family home',
    });
    const ctx = resolver.getStageContext(will, { beneficiaries: true });
    expect(ctx.stage).toBe(InterviewStage.ASSETS);
    expect(ctx.question.toLowerCase()).toContain('another asset');
  });

  it('enters GUARDIAN stage when minor beneficiary exists and executor is set', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    const minorDob = new Date();
    minorDob.setFullYear(minorDob.getFullYear() - 10);
    addTestBeneficiary(will, 'Child Doe', 'child', minorDob);
    will.appointExecutor({
      id: executorId(randomUUID()),
      fullName: 'Executor Person',
      isPrimary: true,
    });
    const checkpoints = { beneficiaries: true, assets: true };
    expect(resolver.hasMinorBeneficiaries(will)).toBe(true);
    expect(resolver.resolveStage(will, checkpoints)).toBe(InterviewStage.GUARDIAN);
  });
});
