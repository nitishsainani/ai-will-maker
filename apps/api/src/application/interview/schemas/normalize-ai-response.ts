import { randomUUID } from 'crypto';
import { EMPTY_WILL_INTERVIEW_DRAFT } from '@will-maker/will-contract';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'yep', 'sure', 'ok', 'okay', 'correct', 'i agree'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', 'nope', 'not', 'never', 'i do not'].includes(normalized)) {
      return false;
    }
  }
  return undefined;
}

function unwrapSchemaLikeResponse(raw: Record<string, unknown>): Record<string, unknown> {
  if (
    raw.type === 'object' &&
    raw.properties &&
    typeof raw.properties === 'object' &&
    !Array.isArray(raw.properties)
  ) {
    const properties = raw.properties as Record<string, unknown>;
    if (properties.assistantMessage || properties.willDraft || properties.extractedData) {
      return properties;
    }
  }
  return raw;
}

function normalizeLegacyExtractedToDraft(
  extractedData: Record<string, unknown>,
): Record<string, unknown> {
  const draft: Record<string, unknown> = { ...EMPTY_WILL_INTERVIEW_DRAFT };

  if (extractedData.testator) draft.testator = extractedData.testator;
  if (extractedData.revocation) draft.revocation = extractedData.revocation;
  if (Array.isArray(extractedData.beneficiaries)) draft.beneficiaries = extractedData.beneficiaries;
  if (Array.isArray(extractedData.assets)) draft.assets = extractedData.assets;
  if (Array.isArray(extractedData.assetAllocations)) {
    draft.assetAllocations = extractedData.assetAllocations;
  }
  if (extractedData.executor) draft.executor = extractedData.executor;
  if (extractedData.guardian) draft.guardian = extractedData.guardian;
  if (Array.isArray(extractedData.witnesses)) draft.witnesses = extractedData.witnesses;
  if (extractedData.executionDetails) draft.executionDetails = extractedData.executionDetails;

  return normalizeWillDraft(draft);
}

function ensureUuid(record: Record<string, unknown>): string {
  const existing = readString(record.id);
  if (existing && isUuid(existing)) return existing;
  const id = randomUUID();
  record.id = id;
  return id;
}

function resolveIndex(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  const asString = readString(value);
  if (asString && /^\d+$/.test(asString)) return Number(asString);
  return undefined;
}

function resolveBeneficiaryId(
  rawId: unknown,
  beneficiaries: Record<string, unknown>[],
  beneficiaryIds: string[],
): string | undefined {
  const direct = readString(rawId);
  if (direct && isUuid(direct)) return direct;

  const index = resolveIndex(rawId);
  if (index !== undefined && beneficiaryIds[index]) {
    return beneficiaryIds[index];
  }

  if (direct) {
    const byName = beneficiaries.find(
      (b) => readString(b.fullName)?.toLowerCase() === direct.toLowerCase(),
    );
    if (byName) return readString(byName.id);
  }

  return undefined;
}

function resolveAssetId(
  rawId: unknown,
  assets: Record<string, unknown>[],
  assetIds: string[],
): string | undefined {
  const direct = readString(rawId);
  if (direct && isUuid(direct)) return direct;

  const index = resolveIndex(rawId);
  if (index !== undefined && assetIds[index]) {
    return assetIds[index];
  }

  if (direct) {
    const byDescription = assets.find(
      (a) => readString(a.description)?.toLowerCase() === direct.toLowerCase(),
    );
    if (byDescription) return readString(byDescription.id);
  }

  return undefined;
}

/**
 * Repairs common AI draft mistakes: missing UUIDs, array-index references, percentage alias.
 */
export function normalizeWillDraft(draftInput: unknown): Record<string, unknown> {
  if (!draftInput || typeof draftInput !== 'object') {
    return { ...EMPTY_WILL_INTERVIEW_DRAFT };
  }

  const draft = { ...(draftInput as Record<string, unknown>) };

  const beneficiaries = Array.isArray(draft.beneficiaries)
    ? draft.beneficiaries.map((item) =>
        item && typeof item === 'object' ? { ...(item as Record<string, unknown>) } : {},
      )
    : [];
  const beneficiaryIds = beneficiaries.map((b) => ensureUuid(b));
  draft.beneficiaries = beneficiaries;

  const assets = Array.isArray(draft.assets)
    ? draft.assets.map((item) =>
        item && typeof item === 'object' ? { ...(item as Record<string, unknown>) } : {},
      )
    : [];
  const assetIds = assets.map((a) => ensureUuid(a));
  draft.assets = assets;

  const witnesses = Array.isArray(draft.witnesses)
    ? draft.witnesses.map((item) =>
        item && typeof item === 'object' ? { ...(item as Record<string, unknown>) } : {},
      )
    : [];
  witnesses.forEach((w) => ensureUuid(w));
  draft.witnesses = witnesses;

  if (draft.executor && typeof draft.executor === 'object') {
    const executor = { ...(draft.executor as Record<string, unknown>) };
    ensureUuid(executor);
    draft.executor = executor;
  }

  if (draft.guardian && typeof draft.guardian === 'object') {
    const guardian = { ...(draft.guardian as Record<string, unknown>) };
    ensureUuid(guardian);
    const wardIndex = resolveIndex(guardian.wardBeneficiaryId);
    if (wardIndex !== undefined && beneficiaryIds[wardIndex]) {
      guardian.wardBeneficiaryId = beneficiaryIds[wardIndex];
    }
    draft.guardian = guardian;
  }

  if (draft.revocation && typeof draft.revocation === 'object') {
    const revocation = { ...(draft.revocation as Record<string, unknown>) };
    if (Object.keys(revocation).length === 0) {
      delete draft.revocation;
    } else {
      draft.revocation = revocation;
    }
  }

  draft.assetAllocations = Array.isArray(draft.assetAllocations)
    ? draft.assetAllocations.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const record = { ...(item as Record<string, unknown>) };

        if (record.sharePct === undefined && record.percentage !== undefined) {
          record.sharePct = record.percentage;
        }
        delete record.percentage;

        const allocationId = readString(record.id);
        if (allocationId && isUuid(allocationId)) {
          record.id = allocationId;
        } else if (allocationId) {
          record.id = randomUUID();
        }

        const assetId = resolveAssetId(record.assetId, assets, assetIds);
        if (assetId) record.assetId = assetId;

        const beneficiaryId = resolveBeneficiaryId(
          record.beneficiaryId ?? record.beneficiaryName,
          beneficiaries,
          beneficiaryIds,
        );
        if (beneficiaryId) record.beneficiaryId = beneficiaryId;
        delete record.beneficiaryName;

        return record;
      })
    : [];

  draft.beneficiaries ??= [];
  draft.assets ??= [];
  draft.assetAllocations ??= [];
  draft.witnesses ??= [];

  return draft;
}

/**
 * Normalizes AI JSON before Zod validation. Supports legacy extractedData wrapper.
 */
export function normalizeAiResponsePayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;

  const record = unwrapSchemaLikeResponse(raw as Record<string, unknown>);
  const normalized: Record<string, unknown> = { ...record };

  if (!normalized.willDraft && normalized.extractedData) {
    normalized.willDraft = normalizeLegacyExtractedToDraft(
      normalized.extractedData as Record<string, unknown>,
    );
    delete normalized.extractedData;
  }

  if (normalized.willDraft) {
    normalized.willDraft = normalizeWillDraft(normalized.willDraft);
  }

  if (typeof normalized.assistantMessage !== 'string' || !normalized.assistantMessage.trim()) {
    const fallback = readString(normalized.clarificationPrompt);
    normalized.assistantMessage =
      fallback ?? 'I had trouble understanding that. Could you please try again?';
  }

  if (normalized.needsClarification === undefined) {
    normalized.needsClarification = normalizeBoolean(normalized.needsClarification) ?? false;
  }

  return normalized;
}
