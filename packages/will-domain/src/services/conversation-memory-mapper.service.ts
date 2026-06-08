import { randomUUID } from 'crypto';
import {
  BeneficiaryId,
  DomainError,
  Result,
  assetAllocationId,
  assetId,
  beneficiaryId,
  domainError,
  executorId,
  guardianId,
  witnessId,
  fail,
  ok,
} from '@will-maker/shared-kernel';
import { AssetType } from '../enums';
import { ConversationMemory } from '../entities/conversation-memory.entity';
import { Will } from '../entities/will.entity';
import { Email } from '../value-objects/email.vo';
import { Money } from '../value-objects/money.vo';
import { SharePct } from '../value-objects/share-pct.vo';

interface BeneficiaryFact {
  fullName: string;
  relationship: string;
  priorityOrder?: number;
  dateOfBirth?: string;
}

interface BeneficiaryRelationshipFact {
  beneficiaryName: string;
  relationship: string;
}

interface AssetFact {
  type: AssetType;
  description: string;
  estimatedValue?: number;
  currency?: string;
  beneficiaryName?: string;
  sharePct?: number;
}

interface ExecutorFact {
  fullName: string;
  email?: string;
  isPrimary?: boolean;
}

interface GuardianFact {
  wardName: string;
  fullName: string;
  relationship: string;
}

interface WitnessFact {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  witnessOrder: number;
}

export interface DraftFactInput {
  key: string;
  value: unknown;
}

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readStringField(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readNonEmptyString(record[key]);
    if (value) return value;
  }
  return undefined;
}

export class ConversationMemoryMapper {
  applyToWill(will: Will, memories: ConversationMemory[]): Result<void, DomainError> {
    const facts = memories
      .filter((memory) => memory.fact.isHighConfidence())
      .map((memory) => ({ key: memory.factKey, value: memory.fact.value }));
    return this.applyFacts(will, facts);
  }

  applyFacts(will: Will, facts: DraftFactInput[]): Result<void, DomainError> {
    for (const { key, value } of facts) {
      if (key === 'testator.name') {
        const name = readNonEmptyString(value);
        if (!name) continue;
        const result = will.setTestatorName(name);
        if (!result.ok) return result;
      } else if (key === 'beneficiary.relationship') {
        const fact = this.normalizeBeneficiaryRelationshipFact(value);
        if (!fact) continue;
        const result = this.applyBeneficiaryRelationship(will, fact);
        if (!result.ok) return result;
      } else if (key.startsWith('beneficiary.')) {
        const fact = this.normalizeBeneficiaryFact(value);
        if (!fact) continue;
        const result = this.applyBeneficiary(will, fact);
        if (!result.ok) return result;
      } else if (key.startsWith('asset.')) {
        const fact = this.normalizeAssetFact(value);
        if (!fact) continue;
        const result = this.applyAsset(will, fact);
        if (!result.ok) return result;
      } else if (key.startsWith('executor.')) {
        const fact = this.normalizeExecutorFact(value);
        if (!fact) continue;
        const result = this.applyExecutor(will, fact);
        if (!result.ok) return result;
      } else if (key.startsWith('guardian.')) {
        const fact = this.normalizeGuardianFact(value);
        if (!fact) continue;
        const result = this.applyGuardian(will, fact);
        if (!result.ok) return result;
      } else if (key.startsWith('witness.')) {
        const fact = this.normalizeWitnessFact(value, key);
        if (!fact) continue;
        const result = this.applyWitness(will, fact);
        if (!result.ok) return result;
      }
    }

    return ok(undefined);
  }

  private normalizeBeneficiaryFact(value: unknown): BeneficiaryFact | null {
    if (typeof value === 'string') {
      const fullName = readNonEmptyString(value);
      return fullName ? { fullName, relationship: 'unspecified' } : null;
    }
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const fullName = readStringField(record, 'fullName', 'name');
    if (!fullName) return null;

    return {
      fullName,
      relationship: readStringField(record, 'relationship') ?? 'unspecified',
      priorityOrder:
        typeof record.priorityOrder === 'number' ? record.priorityOrder : undefined,
      dateOfBirth: readStringField(record, 'dateOfBirth'),
    };
  }

  private normalizeAssetFact(value: unknown): AssetFact | null {
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const description = readStringField(record, 'description', 'name');
    if (!description) return null;

    const typeValue = record.type;
    const type =
      typeof typeValue === 'string' && Object.values(AssetType).includes(typeValue as AssetType)
        ? (typeValue as AssetType)
        : AssetType.OTHER;

    const allocations = Array.isArray(record.allocations) ? record.allocations : [];
    const firstAllocation =
      allocations.length > 0 && typeof allocations[0] === 'object'
        ? (allocations[0] as Record<string, unknown>)
        : undefined;

    return {
      type,
      description,
      estimatedValue:
        typeof record.estimatedValue === 'number' ? record.estimatedValue : undefined,
      currency: readStringField(record, 'currency'),
      beneficiaryName:
        readStringField(record, 'beneficiaryName') ??
        (firstAllocation ? readStringField(firstAllocation, 'beneficiaryName', 'name') : undefined),
      sharePct:
        typeof record.sharePct === 'number'
          ? record.sharePct
          : firstAllocation && typeof firstAllocation.sharePct === 'number'
            ? firstAllocation.sharePct
            : undefined,
    };
  }

  private normalizeExecutorFact(value: unknown): ExecutorFact | null {
    if (typeof value === 'string') {
      const fullName = readNonEmptyString(value);
      return fullName ? { fullName, isPrimary: true } : null;
    }
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const fullName = readStringField(record, 'fullName', 'name');
    if (!fullName) return null;

    return {
      fullName,
      email: readStringField(record, 'email'),
      isPrimary:
        typeof record.isPrimary === 'boolean' ? record.isPrimary : true,
    };
  }

  private normalizeGuardianFact(value: unknown): GuardianFact | null {
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const wardName = readStringField(record, 'wardName', 'ward', 'beneficiaryName');
    const fullName = readStringField(record, 'fullName', 'name', 'guardianName');
    const relationship = readStringField(record, 'relationship');
    if (!wardName || !fullName || !relationship) return null;

    return { wardName, fullName, relationship };
  }

  private witnessOrderFromKey(key: string): number | undefined {
    const suffix = key.slice('witness.'.length);
    const index = Number.parseInt(suffix, 10);
    if (Number.isNaN(index) || index < 0) return undefined;
    return index + 1;
  }

  private normalizeWitnessFact(value: unknown, factKey: string): WitnessFact | null {
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const fullName = readStringField(record, 'fullName', 'name');
    const addressLine1 = readStringField(record, 'addressLine1', 'address');
    const city = readStringField(record, 'city');
    const state = readStringField(record, 'state');
    if (!fullName || !addressLine1 || !city || !state) return null;

    const witnessOrder =
      typeof record.witnessOrder === 'number'
        ? record.witnessOrder
        : this.witnessOrderFromKey(factKey) ?? 1;

    return {
      fullName,
      addressLine1,
      city,
      state,
      witnessOrder,
    };
  }

  private normalizeBeneficiaryRelationshipFact(value: unknown): BeneficiaryRelationshipFact | null {
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const beneficiaryName = readStringField(record, 'beneficiaryName', 'fullName', 'name');
    const relationship = readStringField(record, 'relationship');
    if (!beneficiaryName || !relationship) return null;

    return { beneficiaryName, relationship };
  }

  private applyBeneficiaryRelationship(
    will: Will,
    fact: BeneficiaryRelationshipFact,
  ): Result<void, DomainError> {
    const existing =
      will.beneficiaries.find(
        (b) => b.fullName.toLowerCase() === fact.beneficiaryName.toLowerCase(),
      ) ?? will.beneficiaries.find((b) => b.relationship === 'unspecified');

    if (!existing) {
      return fail(
        domainError(
          'BENEFICIARY_NOT_FOUND',
          `Beneficiary '${fact.beneficiaryName}' not found for relationship update`,
        ),
      );
    }

    existing.updateRelationship(fact.relationship);
    return ok(undefined);
  }

  private applyBeneficiary(will: Will, fact: BeneficiaryFact): Result<void, DomainError> {
    const existing = will.beneficiaries.find(
      (b) => b.fullName.toLowerCase() === fact.fullName.toLowerCase(),
    );

    let beneficiaryIdRef: BeneficiaryId;

    if (existing) {
      existing.rename(fact.fullName);
      existing.updateRelationship(fact.relationship);
      if (fact.dateOfBirth) existing.setDateOfBirth(new Date(fact.dateOfBirth));
      beneficiaryIdRef = existing.id;
    } else {
      const id = beneficiaryId(randomUUID());
      const result = will.addBeneficiary({
        id,
        fullName: fact.fullName,
        relationship: fact.relationship,
        priorityOrder: fact.priorityOrder,
        dateOfBirth: fact.dateOfBirth ? new Date(fact.dateOfBirth) : undefined,
      });
      if (!result.ok) return result;
      beneficiaryIdRef = result.value;
    }

    return ok(undefined);
  }

  private applyAsset(will: Will, fact: AssetFact): Result<void, DomainError> {
    const existing = will.assets.find(
      (a) => a.description.toLowerCase() === fact.description.toLowerCase(),
    );

    let assetIdRef;

    if (existing) {
      assetIdRef = existing.id;
    } else {
      const id = assetId(randomUUID());
      let money: Money | undefined;

      if (fact.estimatedValue !== undefined) {
        const moneyResult = Money.create(fact.estimatedValue, fact.currency ?? 'USD');
        if (!moneyResult.ok) return moneyResult;
        money = moneyResult.value;
      }

      const addResult = will.addAsset({
        id,
        type: fact.type ?? AssetType.OTHER,
        description: fact.description,
        estimatedValue: money,
      });
      if (!addResult.ok) return addResult;
      assetIdRef = id;
    }

    if (fact.beneficiaryName && fact.sharePct !== undefined) {
      const beneficiary = will.beneficiaries.find(
        (b) => b.fullName.toLowerCase() === fact.beneficiaryName!.toLowerCase(),
      );
      if (!beneficiary) {
        return fail(
          domainError(
            'BENEFICIARY_NOT_FOUND',
            `Beneficiary '${fact.beneficiaryName}' not found for asset allocation`,
          ),
        );
      }

      const shareResult = SharePct.create(fact.sharePct);
      if (!shareResult.ok) return shareResult;

      return will.assignAssetShare(
        assetIdRef,
        beneficiary.id,
        shareResult.value,
        assetAllocationId(randomUUID()),
      );
    }

    return ok(undefined);
  }

  private applyExecutor(will: Will, fact: ExecutorFact): Result<void, DomainError> {
    let email: Email | undefined;
    if (fact.email) {
      const emailResult = Email.create(fact.email);
      if (!emailResult.ok) return emailResult;
      email = emailResult.value;
    }

    const existing = will.executors.find(
      (e) => e.fullName.toLowerCase() === fact.fullName.toLowerCase(),
    );

    if (existing) {
      existing.rename(fact.fullName);
      if (email) existing.updateEmail(email);
      if (fact.isPrimary) {
        will.executors.forEach((e) => e.demote());
        existing.markPrimary();
      }
      return ok(undefined);
    }

    const hasPrimary = will.executors.some((e) => e.isPrimary);
    const result = will.appointExecutor({
      id: executorId(randomUUID()),
      fullName: fact.fullName,
      email,
      isPrimary: fact.isPrimary ?? !hasPrimary,
    });
    if (!result.ok) return result;
    return ok(undefined);
  }

  private applyGuardian(will: Will, fact: GuardianFact): Result<void, DomainError> {
    const ward = will.beneficiaries.find(
      (b) => b.fullName.toLowerCase() === fact.wardName.toLowerCase(),
    );
    if (!ward) {
      return fail(
        domainError('BENEFICIARY_NOT_FOUND', `Ward beneficiary '${fact.wardName}' not found`),
      );
    }

    const result = will.nameGuardian(ward.id, {
      id: guardianId(randomUUID()),
      fullName: fact.fullName,
      relationship: fact.relationship,
    });
    if (!result.ok) return result;
    return ok(undefined);
  }

  private applyWitness(will: Will, fact: WitnessFact): Result<void, DomainError> {
    const existing = will.witnesses.find((w) => w.witnessOrder === fact.witnessOrder);
    if (existing) {
      existing.rename(fact.fullName);
      existing.updateAddress(fact.addressLine1, fact.city, fact.state);
      return ok(undefined);
    }

    const result = will.addWitness({
      id: witnessId(randomUUID()),
      fullName: fact.fullName,
      addressLine1: fact.addressLine1,
      city: fact.city,
      state: fact.state,
      witnessOrder: fact.witnessOrder,
    });
    if (!result.ok) return result;
    return ok(undefined);
  }
}
