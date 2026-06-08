import {
  conversationId,
  conversationMemoryId,
  conversationMessageId,
  willId,
} from '@will-maker/shared-kernel';
import {
  Conversation,
  ConversationMemory,
  ConversationMessage,
  ConversationStatus,
  MessageRole,
  MemoryFact,
  MemoryFactSource,
} from '@will-maker/will-domain';
import { Prisma } from '@prisma/client';

export type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: {
    memories: true;
    messages: true;
  };
}>;

export class ConversationPrismaMapper {
  static toDomain(row: ConversationWithRelations): Conversation {
    return Conversation.reconstitute({
      id: conversationId(row.id),
      willId: willId(row.willId),
      aiProvider: row.aiProvider,
      status: row.status as ConversationStatus,
      startedAt: row.startedAt,
      endedAt: row.endedAt ?? undefined,
      summary: row.summary ?? undefined,
      memories: row.memories.map((m) =>
        ConversationMemory.reconstitute({
          id: conversationMemoryId(m.id),
          conversationId: conversationId(m.conversationId),
          fact: MemoryFact.reconstitute(
            m.factKey,
            m.factValue,
            m.confidence,
            m.source as MemoryFactSource,
          ),
          extractedAt: m.extractedAt,
        }),
      ),
      messages: row.messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((msg) =>
          ConversationMessage.reconstitute({
            id: conversationMessageId(msg.id),
            conversationId: conversationId(msg.conversationId),
            role: msg.role as MessageRole,
            content: msg.content,
            createdAt: msg.createdAt,
          }),
        ),
    });
  }
}
