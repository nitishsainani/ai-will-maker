import { Injectable } from '@nestjs/common';
import { WillId, UserId, willId, userId, domainError } from '@will-maker/shared-kernel';
import {
  WillRepository,
  Will,
  WillSummary,
  FindWillOptions,
  WillStatus,
} from '@will-maker/will-domain';
import { ConversationPrismaPersistence } from '../conversation-prisma.persistence';
import { WillPrismaMapper } from '../mappers/will-prisma.mapper';
import { PrismaService } from '../prisma.service';

const FULL_INCLUDE = {
  beneficiaries: true,
  assets: true,
  assetAllocations: true,
  executors: true,
  guardians: true,
  witnesses: true,
  conversations: {
    include: { memories: true, messages: { orderBy: { createdAt: 'asc' as const } } },
  },
} as const;

const LEGAL_INCLUDE = {
  beneficiaries: true,
  assets: true,
  assetAllocations: true,
  executors: true,
  guardians: true,
  witnesses: true,
};

@Injectable()
export class PrismaWillRepository implements WillRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationPersistence: ConversationPrismaPersistence,
  ) {}

  async findById(id: WillId, options?: FindWillOptions): Promise<Will | null> {
    const includeConversation = options?.includeConversation ?? false;
    const row = await this.prisma.will.findUnique({
      where: { id: id as string },
      include: includeConversation ? FULL_INCLUDE : LEGAL_INCLUDE,
    });

    if (!row) return null;

    const rowWithConversations = includeConversation
      ? row
      : { ...row, conversations: [] };

    return WillPrismaMapper.toDomain(
      rowWithConversations as Parameters<typeof WillPrismaMapper.toDomain>[0],
      includeConversation,
    );
  }

  async findByUserId(userIdParam: UserId): Promise<WillSummary[]> {
    const rows = await this.prisma.will.findMany({
      where: { userId: userIdParam as string },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => ({
      id: willId(row.id),
      userId: userId(row.userId),
      title: row.title,
      status: row.status as WillStatus,
      revision: row.revision,
      testatorName: row.testatorName ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async save(will: Will): Promise<void> {
    const currentRevision = will.revision;
    let revisionBumped = false;

    await this.prisma.$transaction(async (tx) => {
      const willIdStr = will.id as string;
      const existingWill = await tx.will.findUnique({ where: { id: willIdStr } });

      if (!existingWill) {
        await tx.will.create({
          data: {
            id: willIdStr,
            userId: will.userId as string,
            title: will.title,
            status: will.status,
            testatorName: will.testatorName ?? null,
            testatorAge: will.testatorAge ?? null,
            testatorAddress: will.testatorAddress ?? null,
            soundMindDeclaration: will.soundMindDeclaration ?? null,
            revokesPreviousWills: will.revokesPreviousWills ?? null,
            executionDate: will.executionDate ?? null,
            executionPlace: will.executionPlace ?? null,
            testatorSignatureLine: will.testatorSignatureLine ?? null,
            witnessSignatureLines: will.witnessSignatureLines ?? null,
            metadata: will.metadata as object,
            revision: currentRevision,
            createdAt: will.createdAt,
            updatedAt: will.updatedAt,
          },
        });
      } else {
        const updated = await tx.will.updateMany({
          where: { id: willIdStr, revision: currentRevision },
          data: {
            title: will.title,
            status: will.status,
            testatorName: will.testatorName ?? null,
            testatorAge: will.testatorAge ?? null,
            testatorAddress: will.testatorAddress ?? null,
            soundMindDeclaration: will.soundMindDeclaration ?? null,
            revokesPreviousWills: will.revokesPreviousWills ?? null,
            executionDate: will.executionDate ?? null,
            executionPlace: will.executionPlace ?? null,
            testatorSignatureLine: will.testatorSignatureLine ?? null,
            witnessSignatureLines: will.witnessSignatureLines ?? null,
            metadata: will.metadata as object,
            updatedAt: will.updatedAt,
            revision: currentRevision + 1,
          },
        });

        if (updated.count === 0) {
          throw domainError(
            'CONCURRENCY_CONFLICT',
            'Will was modified by another process',
          );
        }
        revisionBumped = true;
      }

      await tx.beneficiary.deleteMany({
        where: {
          willId: willIdStr,
          id: { notIn: will.beneficiaries.map((b) => b.id as string) },
        },
      });
      await tx.asset.deleteMany({
        where: {
          willId: willIdStr,
          id: { notIn: will.assets.map((a) => a.id as string) },
        },
      });
      await tx.assetAllocation.deleteMany({
        where: {
          willId: willIdStr,
          id: { notIn: will.assetAllocations.map((a) => a.id as string) },
        },
      });
      await tx.executor.deleteMany({
        where: {
          willId: willIdStr,
          id: { notIn: will.executors.map((e) => e.id as string) },
        },
      });
      await tx.guardian.deleteMany({
        where: {
          willId: willIdStr,
          id: { notIn: will.guardians.map((g) => g.id as string) },
        },
      });
      await tx.witness.deleteMany({
        where: {
          willId: willIdStr,
          id: { notIn: will.witnesses.map((w) => w.id as string) },
        },
      });

      for (const b of will.beneficiaries) {
        await tx.beneficiary.upsert({
          where: { id: b.id as string },
          create: {
            id: b.id as string,
            willId: willIdStr,
            fullName: b.fullName,
            relationship: b.relationship,
            priorityOrder: b.priorityOrder,
            dateOfBirth: b.dateOfBirth ?? null,
            age: b.age ?? null,
            isMinor: b.isMinorDeclared ?? null,
            contactEmail: b.contactEmail ?? null,
            addressLine1: b.addressLine1 ?? null,
            city: b.city ?? null,
            state: b.state ?? null,
          },
          update: {
            fullName: b.fullName,
            relationship: b.relationship,
            priorityOrder: b.priorityOrder,
            dateOfBirth: b.dateOfBirth ?? null,
            age: b.age ?? null,
            isMinor: b.isMinorDeclared ?? null,
            contactEmail: b.contactEmail ?? null,
            addressLine1: b.addressLine1 ?? null,
            city: b.city ?? null,
            state: b.state ?? null,
          },
        });
      }

      for (const a of will.assets) {
        await tx.asset.upsert({
          where: { id: a.id as string },
          create: {
            id: a.id as string,
            willId: willIdStr,
            type: a.type,
            description: a.description,
            userLabel: a.userLabel ?? null,
            estimatedValue: a.estimatedValue?.amount ?? null,
            currency: a.estimatedValue?.currency ?? 'USD',
            locationOrAccountDetails: a.locationOrAccountDetails ?? null,
          },
          update: {
            type: a.type,
            description: a.description,
            userLabel: a.userLabel ?? null,
            estimatedValue: a.estimatedValue?.amount ?? null,
            currency: a.estimatedValue?.currency ?? 'USD',
            locationOrAccountDetails: a.locationOrAccountDetails ?? null,
          },
        });
      }

      for (const alloc of will.assetAllocations) {
        await tx.assetAllocation.upsert({
          where: { id: alloc.id as string },
          create: {
            id: alloc.id as string,
            willId: willIdStr,
            assetId: alloc.assetId as string,
            beneficiaryId: alloc.beneficiaryId as string,
            sharePct: alloc.sharePct.value,
          },
          update: { sharePct: alloc.sharePct.value },
        });
      }

      for (const e of will.executors) {
        await tx.executor.upsert({
          where: { id: e.id as string },
          create: {
            id: e.id as string,
            willId: willIdStr,
            fullName: e.fullName,
            email: e.email?.toString() ?? null,
            isPrimary: e.isPrimary,
            order: e.order,
            relationship: e.relationship ?? null,
            address: e.address ?? null,
          },
          update: {
            fullName: e.fullName,
            email: e.email?.toString() ?? null,
            isPrimary: e.isPrimary,
            order: e.order,
            relationship: e.relationship ?? null,
            address: e.address ?? null,
          },
        });
      }

      for (const g of will.guardians) {
        await tx.guardian.upsert({
          where: { id: g.id as string },
          create: {
            id: g.id as string,
            willId: willIdStr,
            wardBeneficiaryId: g.wardBeneficiaryId as string,
            fullName: g.fullName,
            relationship: g.relationship,
            address: g.address ?? null,
          },
          update: {
            fullName: g.fullName,
            relationship: g.relationship,
            address: g.address ?? null,
          },
        });
      }

      for (const w of will.witnesses) {
        await tx.witness.upsert({
          where: { id: w.id as string },
          create: {
            id: w.id as string,
            willId: willIdStr,
            fullName: w.fullName,
            addressLine1: w.addressLine1,
            city: w.city,
            state: w.state,
            witnessOrder: w.witnessOrder,
            address: w.address ?? null,
            isBeneficiary: w.isBeneficiary ?? null,
          },
          update: {
            fullName: w.fullName,
            addressLine1: w.addressLine1,
            city: w.city,
            state: w.state,
            witnessOrder: w.witnessOrder,
            address: w.address ?? null,
            isBeneficiary: w.isBeneficiary ?? null,
          },
        });
      }

      await this.conversationPersistence.persistMany(tx, [...will.conversations], willIdStr);
    });

    if (revisionBumped) {
      will.markRevisionIncremented();
    }
  }

  async delete(id: WillId): Promise<void> {
    await this.prisma.will.delete({ where: { id: id as string } });
  }

  async exists(id: WillId): Promise<boolean> {
    const count = await this.prisma.will.count({ where: { id: id as string } });
    return count > 0;
  }
}
