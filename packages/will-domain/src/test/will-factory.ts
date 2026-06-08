import { randomUUID } from 'crypto';
import { beneficiaryId, userId, willId } from '@will-maker/shared-kernel';
import { Will } from '../entities/will.entity';
import { WillStatus } from '../enums';
export function createTestWill(overrides: Partial<{ testatorName: string }> = {}): Will {
  const now = new Date();
  return Will.reconstitute({
    id: willId(randomUUID()),
    userId: userId(randomUUID()),
    title: 'Test Will',
    status: WillStatus.DRAFT,
    revision: 1,
    testatorName: overrides.testatorName,
    metadata: {},
    createdAt: now,
    updatedAt: now,
    beneficiaries: [],
    assets: [],
    assetAllocations: [],
    executors: [],
    guardians: [],
    witnesses: [],
    conversations: [],
  });
}

export function addTestBeneficiary(
  will: Will,
  fullName: string,
  relationship: string,
  dateOfBirth?: Date,
) {
  const id = beneficiaryId(randomUUID());
  will.addBeneficiary({ id, fullName, relationship, dateOfBirth });
  return id;
}
