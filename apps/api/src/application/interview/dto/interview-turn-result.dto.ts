import { AiInterviewTurnResponse, WillInterviewDraft } from '@will-maker/will-contract';
import { MemoryStatsDto } from './memory-stats.dto';

export interface InterviewTurnResult {
  assistantMessage: string;
  willDraft: WillInterviewDraft;
  needsClarification: boolean;
  clarificationPrompt?: string;
  isComplete: boolean;
  missingFields: string[];
  aiResponse: AiInterviewTurnResponse;
  progressPercent: number;
  memory: MemoryStatsDto;
}

export type InterviewStreamEvent =
  | { type: 'assistant_delta'; delta: string }
  | { type: 'done'; data: InterviewTurnResult };

export interface ConversationMessageResponseDto {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface StartInterviewResult {
  conversationId: string;
  assistantMessage: string;
  willDraft: WillInterviewDraft;
  missingFields: string[];
  messages: ConversationMessageResponseDto[];
}
