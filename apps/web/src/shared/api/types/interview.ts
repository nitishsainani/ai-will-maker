import type {
  AiInterviewTurnResponse,
  WillInterviewDraft,
} from '@will-maker/will-contract';

export type { AiInterviewTurnResponse, WillInterviewDraft };

export interface MemoryStats {
  strategy: string;
  buildMode: string;
  estimatedTokens: number;
  messageCount: number;
  factCount: number;
  hasSummary: boolean;
}

export interface InterviewTurnResult {
  assistantMessage: string;
  willDraft: WillInterviewDraft;
  needsClarification: boolean;
  clarificationPrompt?: string;
  isComplete: boolean;
  missingFields: string[];
  aiResponse: AiInterviewTurnResponse;
  progressPercent: number;
  memory: MemoryStats;
}

export type InterviewStreamEvent =
  | { type: 'assistant_delta'; delta: string }
  | { type: 'done'; data: InterviewTurnResult }
  | { type: 'error'; message: string };

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface StartInterviewResult {
  conversationId: string;
  assistantMessage: string;
  willDraft: WillInterviewDraft;
  missingFields: string[];
  messages: ConversationMessage[];
}

export interface InterviewStatus {
  active: boolean;
  conversationId?: string;
  progressPercent: number;
  missingFields: string[];
  willDraft: WillInterviewDraft;
  messages: ConversationMessage[];
  isComplete?: boolean;
  memory?: MemoryStats & {
    summary?: string;
    latestSnapshotAt?: string;
  };
}

export interface StreamMessageHandlers {
  onChunk?: (delta: string) => void;
}
