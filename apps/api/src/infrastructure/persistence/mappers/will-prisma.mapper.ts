import {
  assetAllocationId,
  assetId,
  beneficiaryId,
  executorId,
  guardianId,
  userId,
  willId,
  witnessId,
} from '@will-maker/shared-kernel';
import {
  Asset,
  AssetAllocation,
  Beneficiary,
  Executor,
  Guardian,
  Witness,
  Will,
  AssetType,
  WillStatus,
  Email,
  Money,
  SharePct,
} from '@will-maker/will-domain';
import { Prisma } from '@prisma/client';
import { ConversationPrismaMapper } from './conversation-prisma.mapper';

type WillWithRelations = Prisma.WillGetPayload<{
  include: {
    beneficiaries: true;
    assets: true;
    assetAllocations: true;
    executors: true;
    guardians: true;
    witnesses: true;
    conversations: {
      include: {
        memories: true;
        messages: true;
      };
    };
  };
}>;

export class WillPrismaMapper {
  static toDomain(row: WillWithRelations, includeConversation: boolean): Will {
    const conversations = includeConversation
      ? row.conversations.map((c) => ConversationPrismaMapper.toDomain(c))
      : [];

    return Will.reconstitute({
      id: willId(row.id),
      userId: userId(row.userId),
      title: row.title,
      status: row.status as WillStatus,
      revision: row.revision,
      testatorName: row.testatorName ?? undefined,
      testatorAge: row.testatorAge ?? undefined,
      testatorAddress: row.testatorAddress ?? undefined,
      soundMindDeclaration: row.soundMindDeclaration ?? undefined,
      revokesPreviousWills: row.revokesPreviousWills ?? undefined,
      executionDate: row.executionDate ?? undefined,
      executionPlace: row.executionPlace ?? undefined,
      testatorSignatureLine: row.testatorSignatureLine ?? undefined,
      witnessSignatureLines: row.witnessSignatureLines ?? undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      beneficiaries: row.beneficiaries.map((b) =>
        Beneficiary.reconstitute({
          id: beneficiaryId(b.id),
          willId: willId(b.willId),
          fullName: b.fullName,
          relationship: b.relationship,
          priorityOrder: b.priorityOrder,
          dateOfBirth: b.dateOfBirth ?? undefined,
          age: b.age ?? undefined,
          isMinor: b.isMinor ?? undefined,
          contactEmail: b.contactEmail ?? undefined,
          addressLine1: b.addressLine1 ?? undefined,
          city: b.city ?? undefined,
          state: b.state ?? undefined,
        }),
      ),
      assets: row.assets.map((a) => {
        let estimatedValue: Money | undefined;
        if (a.estimatedValue != null) {
          estimatedValue = Money.reconstitute(Number(a.estimatedValue), a.currency);
        }
        return Asset.reconstitute({
          id: assetId(a.id),
          willId: willId(a.willId),
          type: a.type as AssetType,
          description: a.description,
          userLabel: a.userLabel ?? undefined,
          estimatedValue,
          locationOrAccountDetails: a.locationOrAccountDetails ?? undefined,
        });
      }),
      assetAllocations: row.assetAllocations.map((a) =>
        AssetAllocation.reconstitute({
          id: assetAllocationId(a.id),
          willId: willId(a.willId),
          assetId: assetId(a.assetId),
          beneficiaryId: beneficiaryId(a.beneficiaryId),
          sharePct: SharePct.reconstitute(Number(a.sharePct)),
        }),
      ),
      executors: row.executors.map((e) => {
        let email: Email | undefined;
        if (e.email) {
          const emailResult = Email.create(e.email);
          if (emailResult.ok) email = emailResult.value;
        }
        return Executor.reconstitute({
          id: executorId(e.id),
          willId: willId(e.willId),
          fullName: e.fullName,
          email,
          isPrimary: e.isPrimary,
          order: e.order,
          relationship: e.relationship ?? undefined,
          address: e.address ?? undefined,
        });
      }),
      guardians: row.guardians.map((g) =>
        Guardian.reconstitute({
          id: guardianId(g.id),
          willId: willId(g.willId),
          wardBeneficiaryId: beneficiaryId(g.wardBeneficiaryId),
          fullName: g.fullName,
          relationship: g.relationship,
          address: g.address ?? undefined,
        }),
      ),
      witnesses: row.witnesses.map((w) =>
        Witness.reconstitute({
          id: witnessId(w.id),
          willId: willId(w.willId),
          fullName: w.fullName,
          addressLine1: w.addressLine1,
          city: w.city,
          state: w.state,
          witnessOrder: w.witnessOrder,
          address: w.address ?? undefined,
          isBeneficiary: w.isBeneficiary ?? undefined,
        }),
      ),
      conversations,
    });
  }
}
