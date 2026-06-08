import { Injectable } from '@nestjs/common';
import { Conversation } from '@will-maker/will-domain';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationPrismaPersistence {
  async persist(
    tx: Prisma.TransactionClient,
    conversation: Conversation,
    willIdStr: string,
  ): Promise<void> {
    await tx.conversation.upsert({
      where: { id: conversation.id as string },
      create: {
        id: conversation.id as string,
        willId: willIdStr,
        status: conversation.status,
        aiProvider: conversation.aiProvider,
        summary: conversation.summary ?? null,
        startedAt: conversation.startedAt,
        endedAt: conversation.endedAt ?? null,
      },
      update: {
        status: conversation.status,
        summary: conversation.summary ?? null,
        endedAt: conversation.endedAt ?? null,
      },
    });

    const convId = conversation.id as string;

    await tx.conversationMessage.deleteMany({
      where: {
        conversationId: convId,
        id: { notIn: conversation.messages.map((m) => m.id as string) },
      },
    });

    await tx.conversationMemory.deleteMany({
      where: {
        conversationId: convId,
        id: { notIn: conversation.memories.map((m) => m.id as string) },
      },
    });

    for (const msg of conversation.messages) {
      await tx.conversationMessage.upsert({
        where: { id: msg.id as string },
        create: {
          id: msg.id as string,
          conversationId: convId,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        },
        update: { content: msg.content },
      });
    }

    for (const mem of conversation.memories) {
      await tx.conversationMemory.upsert({
        where: { id: mem.id as string },
        create: {
          id: mem.id as string,
          conversationId: convId,
          factKey: mem.factKey,
          factValue: mem.fact.value as object,
          confidence: mem.fact.confidence,
          source: mem.fact.source,
          extractedAt: mem.extractedAt,
        },
        update: {
          factKey: mem.factKey,
          factValue: mem.fact.value as object,
          confidence: mem.fact.confidence,
          source: mem.fact.source,
          extractedAt: mem.extractedAt,
        },
      });
    }
  }

  async persistMany(
    tx: Prisma.TransactionClient,
    conversations: Conversation[],
    willIdStr: string,
  ): Promise<void> {
    for (const conversation of conversations) {
      await this.persist(tx, conversation, willIdStr);
    }
  }
}
