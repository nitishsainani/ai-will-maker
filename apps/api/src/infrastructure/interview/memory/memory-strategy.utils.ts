import { AiMessage } from '../../../application/interview/ports/ai-provider.port';
import { ConversationMessageDto } from '../../../application/interview/ports/memory-manager.port';
export function buildFactSnapshot(
  draftSnapshot: Record<string, unknown>,
): Record<string, unknown> {
  return { ...draftSnapshot };
}

export function resolveSystemContent(
  input: {
    systemContent?: string;
    draftSnapshot: Record<string, unknown>;
    currentTopic: string;
    summary?: string;
    currentQuestion?: string;
  },
): string {
  if (input.systemContent) {
    return input.systemContent;
  }

  const factsSummary = Object.keys(input.draftSnapshot).length
    ? `\n\nWill draft on file:\n${JSON.stringify(input.draftSnapshot, null, 2)}`
    : '';
  const questionHint = input.currentQuestion
    ? `\n\nCurrent question: ${input.currentQuestion}`
    : '';
  return `You are a will-making interviewer.${factsSummary}${questionHint}\n\nCurrent topic: ${input.currentTopic}`;
}

export function toAiMessages(
  systemContent: string,
  messages: ConversationMessageDto[],
): AiMessage[] {
  return [
    { role: 'system', content: systemContent },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];
}

export function estimateTokens(text: string, charsPerToken: number): number {
  return Math.ceil(text.length / charsPerToken);
}

export function estimateContextTokens(
  messages: AiMessage[],
  charsPerToken: number,
): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return estimateTokens(String(totalChars), charsPerToken);
}

export const SUMMARY_SYSTEM_PROMPT =
  'Summarize this will-drafting conversation concisely. Focus on dialogue flow, clarifications, and user intent. Do NOT list beneficiaries, executors, assets, guardians, witnesses, or other structured will data — that is stored in the database. Output plain text only.';

export function buildSummaryUserContent(
  messages: ConversationMessageDto[],
  assistantReply: string,
  previousSummary?: string,
): string {
  return [
    previousSummary ? `Previous summary:\n${previousSummary}` : '',
    'Recent conversation:',
    ...messages.map((m) => `${m.role}: ${m.content}`),
    `assistant: ${assistantReply}`,
  ]
    .filter(Boolean)
    .join('\n');
}
