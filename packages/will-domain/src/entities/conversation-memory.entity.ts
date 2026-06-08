import { ConversationId, ConversationMemoryId } from '@will-maker/shared-kernel';
import { MemoryFact, MemoryFactSource } from '../value-objects/memory-fact.vo';

const DEFAULT_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreateConversationMemoryProps {
  id: ConversationMemoryId;
  conversationId: ConversationId;
  fact: MemoryFact;
  extractedAt?: Date;
}

export class ConversationMemory {
  private constructor(
    readonly id: ConversationMemoryId,
    readonly conversationId: ConversationId,
    private _fact: MemoryFact,
    private _extractedAt: Date,
  ) {}

  static extract(
    id: ConversationMemoryId,
    conversationId: ConversationId,
    key: string,
    value: unknown,
    confidence: number,
    source: MemoryFactSource = 'ai_extraction',
  ): ConversationMemory {
    const fact = MemoryFact.create(key, value, confidence, source);
    return new ConversationMemory(id, conversationId, fact, new Date());
  }

  static reconstitute(props: CreateConversationMemoryProps): ConversationMemory {
    return new ConversationMemory(
      props.id,
      props.conversationId,
      props.fact,
      props.extractedAt ?? new Date(),
    );
  }

  get fact(): MemoryFact {
    return this._fact;
  }

  get factKey(): string {
    return this._fact.key;
  }

  get extractedAt(): Date {
    return this._extractedAt;
  }

  updateFact(fact: MemoryFact): void {
    this._fact = fact;
    this._extractedAt = new Date();
  }

  isStale(maxAgeMs: number = DEFAULT_STALE_MS, asOf: Date = new Date()): boolean {
    return asOf.getTime() - this._extractedAt.getTime() > maxAgeMs;
  }
}
