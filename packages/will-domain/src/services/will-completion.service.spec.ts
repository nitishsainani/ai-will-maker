import { randomUUID } from 'crypto';
import {
  beneficiaryId,
  executorId,
  guardianId,
  witnessId,
} from '@will-maker/shared-kernel';
import { describe, expect, it } from 'vitest';
import { addTestBeneficiary, createTestWill } from '../test/will-factory';
import { WillCompletionService } from './will-completion.service';

describe('WillCompletionService', () => {
  const completion = new WillCompletionService();

  it('warns when witness is also a beneficiary', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    addTestBeneficiary(will, 'John Smith', 'friend');
    will.appointExecutor({
      id: executorId(randomUUID()),
      fullName: 'Executor',
      isPrimary: true,
    });
    will.addWitness({
      id: witnessId(randomUUID()),
      fullName: 'John Smith',
      addressLine1: '1 Main St',
      city: 'Town',
      state: 'CA',
      witnessOrder: 1,
    });
    will.addWitness({
      id: witnessId(randomUUID()),
      fullName: 'Other Person',
      addressLine1: '2 Oak St',
      city: 'Town',
      state: 'CA',
      witnessOrder: 2,
    });

    const report = completion.getFinalizeValidationReport(will);
    const conflict = report.warnings.find((w) => w.code.includes('R-010') || w.message.toLowerCase().includes('witness'));
    expect(conflict).toBeDefined();
  });

  it('requires guardian when minor child exists', () => {
    const will = createTestWill({ testatorName: 'Jane Doe' });
    const minorDob = new Date();
    minorDob.setFullYear(minorDob.getFullYear() - 8);
    const childId = addTestBeneficiary(will, 'Minor Child', 'child', minorDob);
    will.appointExecutor({
      id: executorId(randomUUID()),
      fullName: 'Executor',
      isPrimary: true,
    });

    const report = completion.getValidationReport(will);
    const guardianIssue = report.errors.find(
      (e) => e.code.includes('R-006') || e.message.toLowerCase().includes('guardian'),
    );
    expect(guardianIssue).toBeDefined();

    will.nameGuardian(childId, {
      id: guardianId(randomUUID()),
      fullName: 'Guardian Person',
      relationship: 'sibling',
    });

    const afterGuardian = completion.getValidationReport(will);
    const stillMissing = afterGuardian.errors.find((e) => e.code.includes('R-006'));
    expect(stillMissing).toBeUndefined();
  });
});
