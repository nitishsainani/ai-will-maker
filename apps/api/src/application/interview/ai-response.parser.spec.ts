import { describe, expect, it } from 'vitest';
import { AiResponseParser } from './ai-response.parser';

describe('AiResponseParser', () => {
  const parser = new AiResponseParser();

  it('parses a full AI turn response', () => {
    const raw = JSON.stringify({
      assistantMessage: 'Thanks. Who should inherit your assets?',
      willDraft: {
        testator: { fullName: 'Jane Doe', age: 42 },
        beneficiaries: [],
        assets: [],
        assetAllocations: [],
        witnesses: [],
      },
      needsClarification: false,
      isComplete: false,
      missingFields: ['Beneficiaries'],
    });

    const { response, parseError } = parser.parse(raw);
    expect(parseError).toBeUndefined();
    expect(response.assistantMessage).toContain('inherit');
    expect(response.willDraft.testator?.fullName).toBe('Jane Doe');
    expect(response.missingFields).toEqual(['Beneficiaries']);
  });

  it('normalizes legacy extractedData into willDraft', () => {
    const raw = JSON.stringify({
      assistantMessage: 'Got it.',
      extractedData: {
        testator: { fullName: 'Nitish Sainani' },
        beneficiaries: [],
        assets: [],
        assetAllocations: [
          {
            assetId: '11111111-1111-4111-8111-111111111111',
            beneficiaryId: '22222222-2222-4222-8222-222222222222',
            percentage: 100,
          },
        ],
        witnesses: [],
      },
    });

    const { response, parseError } = parser.parse(raw);
    expect(parseError).toBeUndefined();
    expect(response.willDraft.testator?.fullName).toBe('Nitish Sainani');
    expect(response.willDraft.assetAllocations[0]?.sharePct).toBe(100);
  });

  it('normalizes array-index beneficiaryId and assigns beneficiary UUIDs', () => {
    const raw = JSON.stringify({
      assistantMessage: 'Allocations recorded. Who is your executor?',
      willDraft: {
        testator: { fullName: 'Nitish Sainani', age: 28 },
        beneficiaries: [
          { fullName: 'John Doe', relationship: 'child', age: 28 },
          { fullName: 'Bohn Doe', relationship: 'child', age: 19 },
        ],
        assets: [
          {
            id: 'e1c0e9d3-4c1f-4b6c-8e3a-1a2b8b9e1a01',
            assetType: 'BANK_ACCOUNT',
            description: 'SBI Bank account',
            estimatedValue: 4000000,
          },
        ],
        assetAllocations: [
          {
            assetId: 'e1c0e9d3-4c1f-4b6c-8e3a-1a2b8b9e1a01',
            beneficiaryId: '0',
            sharePct: 50,
          },
          {
            assetId: 'e1c0e9d3-4c1f-4b6c-8e3a-1a2b8b9e1a01',
            beneficiaryId: '1',
            sharePct: 50,
          },
        ],
        witnesses: [],
      },
      needsClarification: true,
      missingFields: ['Executor'],
    });

    const { response, parseError } = parser.parse(raw);
    expect(parseError).toBeUndefined();
    expect(response.willDraft.beneficiaries).toHaveLength(2);
    expect(response.willDraft.beneficiaries[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.willDraft.assetAllocations[0]?.beneficiaryId).toBe(
      response.willDraft.beneficiaries[0]?.id,
    );
    expect(response.willDraft.assetAllocations[1]?.beneficiaryId).toBe(
      response.willDraft.beneficiaries[1]?.id,
    );
    expect(response.assistantMessage).toContain('executor');
  });

  it('returns parse error response preserving current draft', () => {
    const currentDraft = {
      testator: { fullName: 'Jane Doe' },
      beneficiaries: [],
      assets: [],
      assetAllocations: [],
      witnesses: [],
    };

    const { response, parseError } = parser.parse('not json', currentDraft);
    expect(parseError).toBeDefined();
    expect(response.willDraft.testator?.fullName).toBe('Jane Doe');
    expect(response.needsClarification).toBe(true);
  });
});
