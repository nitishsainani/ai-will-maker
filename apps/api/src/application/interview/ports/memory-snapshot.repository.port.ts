export interface MemorySnapshotRecord {
  id: string;
  conversationId: string;
  summary: string;
  messageCount: number;
  factCount: number;
  strategy: string;
  estimatedTokens?: number;
  createdAt: Date;
}

export interface MemorySnapshotRepository {
  append(snapshot: Omit<MemorySnapshotRecord, 'id' | 'createdAt'>): Promise<MemorySnapshotRecord>;
  findLatest(conversationId: string): Promise<MemorySnapshotRecord | null>;
  findByConversationId(conversationId: string, limit?: number): Promise<MemorySnapshotRecord[]>;
}
