import { describe, expect, it } from 'vitest';
import { createTestWill } from '../../test/will-factory';
import { renderTextContract } from './will-text-contract.renderer';
import { InterviewDraftService } from './interview-draft.service';
import { DraftHydrationService } from './draft-hydration.service';
import { WillMapper } from '../wills/will.mapper';
import { deriveProgressPercent } from './draft-progress.util';

describe('contract-driven interview', () => {
  const draftService = new InterviewDraftService();
  const hydrationService = new DraftHydrationService();

  it('renders text contract with current draft JSON', () => {
    const text = renderTextContract({
      testator: { fullName: 'Jane Doe' },
      beneficiaries: [],
      assets: [],
      assetAllocations: [],
      witnesses: [],
    });

    expect(text).toContain('CURRENT WILL DRAFT');
    expect(text).toContain('Jane Doe');
    expect(text).toContain('assistantMessage');
    expect(text).toContain('willDraft');
  });

  it('stores and reads interview draft from will metadata', () => {
    const will = createTestWill();
    const draft = draftService.setDraft(will, {
      testator: { fullName: 'Jane Doe', age: 40 },
      beneficiaries: [],
      assets: [],
      assetAllocations: [],
      witnesses: [],
    });

    expect(draft.testator?.fullName).toBe('Jane Doe');
    expect(draftService.getDraft(will).testator?.age).toBe(40);
  });

  it('projects WillDetailDto from metadata draft while in DRAFT status', () => {
    const will = createTestWill();
    draftService.setDraft(will, {
      testator: { fullName: 'Jane Doe' },
      beneficiaries: [{ fullName: 'Child One', relationship: 'child' }],
      assets: [{ description: 'House', assetType: 'PROPERTY' }],
      assetAllocations: [],
      witnesses: [],
    });

    const dto = WillMapper.toDetailDto(will);
    expect(dto.testatorName).toBe('Jane Doe');
    expect(dto.beneficiaries).toHaveLength(1);
    expect(dto.assets[0]?.description).toBe('House');
  });

  it('hydrates relational entities from draft JSON', () => {
    const will = createTestWill();
    const draft = draftService.setDraft(will, {
      testator: { fullName: 'Jane Doe', age: 50, soundMindDeclaration: true },
      revocation: { revokesPreviousWills: true },
      beneficiaries: [{ fullName: 'Alex', relationship: 'child', age: 10, isMinor: true }],
      assets: [{ description: 'Savings account', assetType: 'BANK_ACCOUNT', estimatedValue: 10000 }],
      assetAllocations: [],
      executor: { fullName: 'Bob Executor', isPrimary: true },
      witnesses: [
        { fullName: 'Witness One', addressLine1: '1 Main', city: 'Town', state: 'ST', witnessOrder: 1 },
        { fullName: 'Witness Two', addressLine1: '2 Main', city: 'Town', state: 'ST', witnessOrder: 2 },
      ],
    });

    hydrationService.hydrate(will, draft);

    expect(will.testatorName).toBe('Jane Doe');
    expect(will.beneficiaries).toHaveLength(1);
    expect(will.assets).toHaveLength(1);
    expect(will.executors).toHaveLength(1);
    expect(will.witnesses).toHaveLength(2);
  });

  it('derives progress percent from missing fields', () => {
    expect(deriveProgressPercent([], true)).toBe(100);
    expect(deriveProgressPercent(['Executor'], false)).toBeGreaterThan(0);
    expect(deriveProgressPercent(['Executor'], false)).toBeLessThan(100);
  });
});
