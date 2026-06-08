import { Conversation } from '@will-maker/will-domain';

export interface ConversationMessageDto {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export function mapConversationMessages(conversation: Conversation): ConversationMessageDto[] {
  return conversation.messages.map((m) => ({
    id: m.id as string,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

export function mapConversationMemories(conversation: Conversation) {
  return conversation.getActiveMemories().map((m) => ({
    factKey: m.factKey,
    factValue: m.fact.value,
    confidence: m.fact.confidence,
  }));
}
