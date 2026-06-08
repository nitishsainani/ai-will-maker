import { ConversationId, WillId } from '@will-maker/shared-kernel';
import { Conversation } from '../entities/conversation.entity';

export interface ConversationRepository {
  findById(id: ConversationId): Promise<Conversation | null>;
  findByWillId(willId: WillId): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<void>;
  delete(id: ConversationId): Promise<void>;
}
