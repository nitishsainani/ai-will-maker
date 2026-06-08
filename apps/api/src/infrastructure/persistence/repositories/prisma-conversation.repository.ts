import { Injectable } from '@nestjs/common';
import { ConversationId, WillId } from '@will-maker/shared-kernel';
import { Conversation, ConversationRepository } from '@will-maker/will-domain';
import { ConversationPrismaPersistence } from '../conversation-prisma.persistence';
import { ConversationPrismaMapper } from '../mappers/conversation-prisma.mapper';
import { PrismaService } from '../prisma.service';

const CONVERSATION_INCLUDE = {
  memories: true,
  messages: { orderBy: { createdAt: 'asc' as const } },
} as const;

@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly persistence: ConversationPrismaPersistence,
  ) {}

  async findById(id: ConversationId): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({
      where: { id: id as string },
      include: CONVERSATION_INCLUDE,
    });

    return row ? ConversationPrismaMapper.toDomain(row) : null;
  }

  async findByWillId(willId: WillId): Promise<Conversation[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { willId: willId as string },
      include: CONVERSATION_INCLUDE,
      orderBy: { startedAt: 'desc' },
    });

    return rows.map((row) => ConversationPrismaMapper.toDomain(row));
  }

  async save(conversation: Conversation): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.persistence.persist(tx, conversation, conversation.willId as string);
    });
  }

  async delete(id: ConversationId): Promise<void> {
    await this.prisma.conversation.delete({ where: { id: id as string } });
  }
}
