import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  MemorySnapshotRecord,
  MemorySnapshotRepository,
} from '../../../application/interview/ports/memory-snapshot.repository.port';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PostgresMemorySnapshotRepository implements MemorySnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    snapshot: Omit<MemorySnapshotRecord, 'id' | 'createdAt'>,
  ): Promise<MemorySnapshotRecord> {
    const row = await this.prisma.conversationMemorySnapshot.create({
      data: {
        id: randomUUID(),
        conversationId: snapshot.conversationId,
        summary: snapshot.summary,
        messageCount: snapshot.messageCount,
        factCount: snapshot.factCount,
        strategy: snapshot.strategy,
        estimatedTokens: snapshot.estimatedTokens ?? null,
      },
    });

    return this.toRecord(row);
  }

  async findLatest(conversationId: string): Promise<MemorySnapshotRecord | null> {
    const row = await this.prisma.conversationMemorySnapshot.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toRecord(row) : null;
  }

  async findByConversationId(
    conversationId: string,
    limit = 20,
  ): Promise<MemorySnapshotRecord[]> {
    const rows = await this.prisma.conversationMemorySnapshot.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.toRecord(row));
  }

  private toRecord(row: {
    id: string;
    conversationId: string;
    summary: string;
    messageCount: number;
    factCount: number;
    strategy: string;
    estimatedTokens: number | null;
    createdAt: Date;
  }): MemorySnapshotRecord {
    return {
      id: row.id,
      conversationId: row.conversationId,
      summary: row.summary,
      messageCount: row.messageCount,
      factCount: row.factCount,
      strategy: row.strategy,
      estimatedTokens: row.estimatedTokens ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
