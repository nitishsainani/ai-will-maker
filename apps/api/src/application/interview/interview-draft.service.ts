import { Injectable } from '@nestjs/common';
import {
  EMPTY_WILL_INTERVIEW_DRAFT,
  WillInterviewDraft,
  WillInterviewDraftSchema,
} from '@will-maker/will-contract';
import { Will } from '@will-maker/will-domain';

@Injectable()
export class InterviewDraftService {

  getDraft(will: Will): WillInterviewDraft {
    const stored = will.getInterviewDraft();
    if (stored) {
      const parsed = WillInterviewDraftSchema.safeParse(stored);
      if (parsed.success) return parsed.data;
    }

    if (this.hasRelationalData(will)) {
      const seeded = this.seedFromRelational(will);
      will.setInterviewDraft(seeded);
      return seeded;
    }

    return { ...EMPTY_WILL_INTERVIEW_DRAFT };
  }

  setDraft(will: Will, draft: WillInterviewDraft): WillInterviewDraft {
    const parsed = WillInterviewDraftSchema.parse(draft);
    will.setInterviewDraft(parsed);
    return parsed;
  }

  ensureDraft(will: Will): WillInterviewDraft {
    const draft = this.getDraft(will);
    if (!will.getInterviewDraft()) {
      will.setInterviewDraft(draft);
    }
    return draft;
  }

  private hasRelationalData(will: Will): boolean {
    return (
      Boolean(will.testatorName) ||
      will.beneficiaries.length > 0 ||
      will.assets.length > 0 ||
      will.executors.length > 0 ||
      will.witnesses.length > 0
    );
  }

  private seedFromRelational(will: Will): WillInterviewDraft {
    const draft: WillInterviewDraft = { ...EMPTY_WILL_INTERVIEW_DRAFT };

    if (will.testatorName || will.testatorAge || will.testatorAddress) {
      draft.testator = {
        fullName: will.testatorName,
        age: will.testatorAge,
        address: will.testatorAddress,
        soundMindDeclaration: will.soundMindDeclaration,
      };
    }

    if (will.revokesPreviousWills !== undefined) {
      draft.revocation = { revokesPreviousWills: will.revokesPreviousWills };
    }

    draft.beneficiaries = will.beneficiaries.map((b) => ({
      id: b.id as string,
      fullName: b.fullName,
      relationship: b.relationship,
      age: b.age,
      isMinor: b.isMinorDeclared ?? (b.age !== undefined ? b.age < 18 : undefined),
      dateOfBirth: b.dateOfBirth?.toISOString().slice(0, 10),
      contactEmail: b.contactEmail,
      addressLine1: b.addressLine1,
      city: b.city,
      state: b.state,
    }));

    draft.assets = will.assets.map((a) => ({
      id: a.id as string,
      assetType: a.type,
      description: a.description,
      estimatedValue: a.estimatedValue?.amount,
      currency: a.estimatedValue?.currency,
      locationOrIdentifier: a.locationOrAccountDetails,
    }));

    draft.assetAllocations = will.assetAllocations.map((a) => ({
      id: a.id as string,
      assetId: a.assetId as string,
      beneficiaryId: a.beneficiaryId as string,
      sharePct: a.sharePct.value,
    }));

    if (will.executors[0]) {
      const e = will.executors[0];
      draft.executor = {
        id: e.id as string,
        fullName: e.fullName,
        email: e.email?.toString(),
        isPrimary: e.isPrimary,
        relationship: e.relationship,
        address: e.address,
      };
    }

    if (will.guardians[0]) {
      const g = will.guardians[0];
      draft.guardian = {
        id: g.id as string,
        wardBeneficiaryId: g.wardBeneficiaryId as string,
        fullName: g.fullName,
        relationship: g.relationship,
        address: g.address,
      };
    }

    draft.witnesses = will.witnesses.map((w) => ({
      id: w.id as string,
      fullName: w.fullName,
      addressLine1: w.addressLine1,
      city: w.city,
      state: w.state,
      witnessOrder: w.witnessOrder,
      isBeneficiary: w.isBeneficiary,
    }));

    if (
      will.executionDate ||
      will.executionPlace ||
      will.testatorSignatureLine !== undefined ||
      will.witnessSignatureLines !== undefined
    ) {
      draft.executionDetails = {
        date: will.executionDate?.toISOString().slice(0, 10),
        place: will.executionPlace,
        testatorSignatureLine: will.testatorSignatureLine,
        witnessSignatureLines: will.witnessSignatureLines,
      };
    }

    return draft;
  }
}
