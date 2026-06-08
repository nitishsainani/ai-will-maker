import { ConversationId, ConversationMessageId } from '@will-maker/shared-kernel';
import { MessageRole } from '../enums';

export interface CreateConversationMessageProps {
  id: ConversationMessageId;
  conversationId: ConversationId;
  role: MessageRole;
  content: string;
  createdAt?: Date;
}

export class ConversationMessage {
  private constructor(
    readonly id: ConversationMessageId,
    readonly conversationId: ConversationId,
    readonly role: MessageRole,
    private _content: string,
    readonly createdAt: Date,
  ) {}

  static create(props: CreateConversationMessageProps): ConversationMessage {
    return new ConversationMessage(
      props.id,
      props.conversationId,
      props.role,
      props.content.trim(),
      props.createdAt ?? new Date(),
    );
  }

  static reconstitute(props: CreateConversationMessageProps): ConversationMessage {
    return ConversationMessage.create(props);
  }

  get content(): string {
    return this._content;
  }

  isFromUser(): boolean {
    return this.role === MessageRole.USER;
  }

  isFromAssistant(): boolean {
    return this.role === MessageRole.ASSISTANT;
  }
}
