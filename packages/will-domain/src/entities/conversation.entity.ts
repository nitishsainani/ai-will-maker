import {
  ConversationId,
  ConversationMemoryId,
  ConversationMessageId,
  DomainError,
  Result,
  WillId,
  domainError,
  fail,
  ok,
} from '@will-maker/shared-kernel';
import { ConversationStatus, MessageRole } from '../enums';
import { MemoryFact, MemoryFactSource } from '../value-objects/memory-fact.vo';
import { ConversationMemory } from './conversation-memory.entity';
import { ConversationMessage } from './conversation-message.entity';

export interface CreateConversationProps {
  id: ConversationId;
  willId: WillId;
  aiProvider: string;
  status?: ConversationStatus;
  startedAt?: Date;
  endedAt?: Date;
  summary?: string;
  memories?: ConversationMemory[];
  messages?: ConversationMessage[];
}

export class Conversation {
  private constructor(
    readonly id: ConversationId,
    readonly willId: WillId,
    private _status: ConversationStatus,
    private _aiProvider: string,
    private _startedAt: Date,
    private _endedAt: Date | undefined,
    private _summary: string | undefined,
    private _memories: ConversationMemory[],
    private _messages: ConversationMessage[],
  ) {}

  static create(props: CreateConversationProps): Conversation {
    return new Conversation(
      props.id,
      props.willId,
      props.status ?? ConversationStatus.ACTIVE,
      props.aiProvider,
      props.startedAt ?? new Date(),
      props.endedAt,
      props.summary,
      props.memories ?? [],
      props.messages ?? [],
    );
  }

  static reconstitute(props: CreateConversationProps): Conversation {
    return Conversation.create(props);
  }

  get status(): ConversationStatus {
    return this._status;
  }

  get aiProvider(): string {
    return this._aiProvider;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get endedAt(): Date | undefined {
    return this._endedAt;
  }

  get summary(): string | undefined {
    return this._summary;
  }

  get memories(): readonly ConversationMemory[] {
    return this._memories;
  }

  get messages(): readonly ConversationMessage[] {
    return this._messages;
  }

  setSummary(summary: string): void {
    this._summary = summary;
  }

  addMessage(
    messageId: ConversationMessageId,
    role: MessageRole,
    content: string,
  ): Result<ConversationMessage, DomainError> {
    if (this._status === ConversationStatus.COMPLETED) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Cannot add messages to a completed conversation'));
    }

    const message = ConversationMessage.create({
      id: messageId,
      conversationId: this.id,
      role,
      content,
    });
    this._messages.push(message);
    return ok(message);
  }

  getLastAssistantMessage(): ConversationMessage | undefined {
    const assistantMessages = this._messages.filter((m) => m.isFromAssistant());
    return assistantMessages[assistantMessages.length - 1];
  }

  addMemory(
    memoryId: ConversationMemoryId,
    fact: MemoryFact,
  ): Result<ConversationMemory, DomainError> {
    if (this._status === ConversationStatus.COMPLETED) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Cannot add memories to a completed conversation'));
    }

    const existing = this._memories.find((m) => m.factKey === fact.key);
    if (existing) {
      existing.updateFact(fact);
      return ok(existing);
    }

    const memory = ConversationMemory.reconstitute({
      id: memoryId,
      conversationId: this.id,
      fact,
    });
    this._memories.push(memory);
    return ok(memory);
  }

  recordExtraction(
    memoryId: ConversationMemoryId,
    key: string,
    value: unknown,
    confidence: number,
    source: MemoryFactSource = 'ai_extraction',
  ): Result<ConversationMemory, DomainError> {
    const fact = MemoryFact.create(key, value, confidence, source);
    return this.addMemory(memoryId, fact);
  }

  pause(): Result<void, DomainError> {
    if (this._status !== ConversationStatus.ACTIVE) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Only active conversations can be paused', {
        current: this._status,
      }));
    }
    this._status = ConversationStatus.PAUSED;
    return ok(undefined);
  }

  resume(): Result<void, DomainError> {
    if (this._status !== ConversationStatus.PAUSED) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Only paused conversations can be resumed', {
        current: this._status,
      }));
    }
    this._status = ConversationStatus.ACTIVE;
    return ok(undefined);
  }

  complete(): Result<void, DomainError> {
    if (this._status === ConversationStatus.COMPLETED) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Conversation is already completed'));
    }
    this._status = ConversationStatus.COMPLETED;
    this._endedAt = new Date();
    return ok(undefined);
  }

  getActiveMemories(): ConversationMemory[] {
    return this._memories.filter((m) => !m.isStale());
  }

  getActiveConversation(): Conversation | undefined {
    return this._status === ConversationStatus.ACTIVE || this._status === ConversationStatus.PAUSED
      ? this
      : undefined;
  }
}
