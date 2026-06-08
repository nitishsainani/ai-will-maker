'use client';

import { ApiError } from '@/shared/api/errors';
import { ChatPresentation } from '../components/chat-presentation';
import { useInterviewChat } from '../hooks/use-interview-chat';

export function ChatContainer({ willId }: { willId: string }) {
  const chat = useInterviewChat(willId);

  if (chat.isLoading) {
    return <p className="text-sm text-muted-foreground">Starting interview…</p>;
  }

  return (
    <ChatPresentation
      messages={chat.messages}
      streamingContent={chat.streamingContent}
      progressPercent={chat.progressPercent}
      isSending={chat.isSending}
      onSend={(text) => chat.sendMessage(text)}
      error={
        chat.sendError instanceof ApiError
          ? chat.sendError.message
          : chat.sendError?.message
      }
    />
  );
}
