import { WillStatus, Will, WillSummary } from '@will-maker/will-domain';
import { WillInterviewDraft, WillInterviewDraftSchema } from '@will-maker/will-contract';
import { WillDetailDto, WillSummaryDto } from './dto/will-detail.dto';

export class WillMapper {
  static toSummaryDto(summary: WillSummary): WillSummaryDto {
    return {
      id: summary.id as string,
      title: summary.title,
      status: summary.status,
      revision: summary.revision,
      testatorName: summary.testatorName,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
    };
  }

  static toDetailDto(will: Will): WillDetailDto {
    if (will.status === WillStatus.DRAFT) {
      const draft = this.readInterviewDraft(will);
      if (draft) {
        return this.fromInterviewDraft(will, draft);
      }
    }

    return this.fromRelational(will);
  }

  private static readInterviewDraft(will: Will): WillInterviewDraft | undefined {
    const parsed = WillInterviewDraftSchema.safeParse(will.getInterviewDraft());
    return parsed.success ? parsed.data : undefined;
  }

  private static fromInterviewDraft(will: Will, draft: WillInterviewDraft): WillDetailDto {
    return {
      id: will.id as string,
      userId: will.userId as string,
      title: will.title,
      status: will.status,
      revision: will.revision,
      testatorName: draft.testator?.fullName ?? will.testatorName,
      createdAt: will.createdAt.toISOString(),
      updatedAt: will.updatedAt.toISOString(),
      beneficiaries: (draft.beneficiaries ?? []).map((b, index) => ({
        id: b.id ?? `draft-beneficiary-${index}`,
        fullName: b.fullName ?? '',
        relationship: b.relationship ?? '',
        priorityOrder: index,
        dateOfBirth: b.dateOfBirth,
      })),
      assets: (draft.assets ?? []).map((a, index) => ({
        id: a.id ?? `draft-asset-${index}`,
        type: a.assetType ?? 'OTHER',
        description: a.description ?? '',
        estimatedValue: a.estimatedValue,
        currency: a.currency ?? 'USD',
      })),
      assetAllocations: (draft.assetAllocations ?? []).map((a, index) => ({
        id: a.id ?? `draft-allocation-${index}`,
        assetId: a.assetId ?? '',
        beneficiaryId: a.beneficiaryId ?? '',
        sharePct: a.sharePct ?? 0,
      })),
      executors: draft.executor
        ? [
            {
              id: draft.executor.id ?? 'draft-executor',
              fullName: draft.executor.fullName ?? '',
              email: draft.executor.email,
              isPrimary: draft.executor.isPrimary ?? true,
              order: 0,
            },
          ]
        : [],
      guardians: draft.guardian
        ? [
            {
              id: draft.guardian.id ?? 'draft-guardian',
              wardBeneficiaryId: draft.guardian.wardBeneficiaryId ?? '',
              fullName: draft.guardian.fullName ?? '',
              relationship: draft.guardian.relationship ?? '',
            },
          ]
        : [],
      witnesses: (draft.witnesses ?? []).map((w, index) => ({
        id: w.id ?? `draft-witness-${index}`,
        fullName: w.fullName ?? '',
        addressLine1: w.addressLine1 ?? '',
        city: w.city ?? '',
        state: w.state ?? '',
        witnessOrder: w.witnessOrder ?? index + 1,
      })),
    };
  }

  private static fromRelational(will: Will): WillDetailDto {
    return {
      id: will.id as string,
      userId: will.userId as string,
      title: will.title,
      status: will.status,
      revision: will.revision,
      testatorName: will.testatorName,
      createdAt: will.createdAt.toISOString(),
      updatedAt: will.updatedAt.toISOString(),
      beneficiaries: will.beneficiaries.map((b) => ({
        id: b.id as string,
        fullName: b.fullName,
        relationship: b.relationship,
        priorityOrder: b.priorityOrder,
        dateOfBirth: b.dateOfBirth?.toISOString(),
      })),
      assets: will.assets.map((a) => ({
        id: a.id as string,
        type: a.type,
        description: a.description,
        estimatedValue: a.estimatedValue?.amount,
        currency: a.estimatedValue?.currency ?? 'USD',
      })),
      assetAllocations: will.assetAllocations.map((a) => ({
        id: a.id as string,
        assetId: a.assetId as string,
        beneficiaryId: a.beneficiaryId as string,
        sharePct: a.sharePct.value,
      })),
      executors: will.executors.map((e) => ({
        id: e.id as string,
        fullName: e.fullName,
        email: e.email?.toString(),
        isPrimary: e.isPrimary,
        order: e.order,
      })),
      guardians: will.guardians.map((g) => ({
        id: g.id as string,
        wardBeneficiaryId: g.wardBeneficiaryId as string,
        fullName: g.fullName,
        relationship: g.relationship,
      })),
      witnesses: will.witnesses.map((w) => ({
        id: w.id as string,
        fullName: w.fullName,
        addressLine1: w.addressLine1,
        city: w.city,
        state: w.state,
        witnessOrder: w.witnessOrder,
      })),
    };
  }
}
