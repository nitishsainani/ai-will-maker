import { AiMessage } from './ai-provider.port';

export type MemoryStrategyName = 'full' | 'summary' | 'hybrid';

export interface ConversationMessageDto {
  role: string;
  content: string;
  createdAt: Date;
}

/** @deprecated Conversation memories are no longer used for will draft data. */
export interface ConversationMemoryDto {
  factKey: string;
  factValue: unknown;
  confidence: number;
}

export interface MemoryBuildInput {
  conversationId: string;
  messages: ConversationMessageDto[];
  /** Authoritative will draft state loaded from database tables. */
  draftSnapshot: Record<string, unknown>;
  summary?: string;
  currentTopic: string;
  currentQuestion?: string;
  /** Pre-built dynamic system prompt (regenerated each turn). */
  systemContent?: string;
}

export interface MemoryContext {
  messages: AiMessage[];
  summary?: string;
  factSnapshot: Record<string, unknown>;
  /** Which mode was used for this build (e.g. hybrid may use full or compressed) */
  buildMode: 'full' | 'compressed';
  /** Rough token estimate for observability */
  estimatedTokens: number;
}

export interface MemoryUpdateInput {
  conversationId: string;
  messages: ConversationMessageDto[];
  assistantReply: string;
  newFacts: Array<{ key: string; value: unknown }>;
  summary?: string;
}

export interface MemoryUpdateResult {
  summary?: string;
  shouldPersistSnapshot: boolean;
  strategy: MemoryStrategyName;
  messageCount: number;
  factCount: number;
}

/**
 * MemoryManager — builds AI context windows without sending full history every turn.
 * Structured will draft data comes from database tables, not conversation memories.
 */
export interface MemoryManager {
  readonly strategyName: MemoryStrategyName;
  buildContext(input: MemoryBuildInput): MemoryContext;
  updateAfterTurn(input: MemoryUpdateInput): Promise<MemoryUpdateResult>;
}

/** @deprecated Use MemoryManager */
export type IMemoryManager = MemoryManager;
