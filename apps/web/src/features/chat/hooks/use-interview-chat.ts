'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import { invalidateWillWorkspace } from '@/shared/lib/invalidate-will-workspace';
import type { ConversationMessage as ApiConversationMessage } from '@/shared/api/types/interview';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function toChatMessages(messages: ApiConversationMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    }));
}

export function useInterviewChat(willId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const initializedRef = useRef(false);

  const statusQuery = useQuery({
    queryKey: queryKeys.interview.status(willId),
    queryFn: () => api.interview.status(willId),
    enabled: !!willId,
  });

  const startMutation = useMutation({
    mutationFn: () => api.interview.start(willId),
    onSuccess: (result) => {
      setMessages(toChatMessages(result.messages));
      queryClient.invalidateQueries({ queryKey: queryKeys.interview.status(willId) });
    },
  });

  useEffect(() => {
    initializedRef.current = false;
    setMessages([]);
    setStreamingContent('');
  }, [willId]);

  useEffect(() => {
    if (!willId || !statusQuery.isSuccess || initializedRef.current) return;

    if (statusQuery.data.active) {
      setMessages(toChatMessages(statusQuery.data.messages ?? []));
      initializedRef.current = true;
      return;
    }

    initializedRef.current = true;
    startMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [willId, statusQuery.isSuccess, statusQuery.data]);

  const invalidateAfterTurn = useCallback(
    () => invalidateWillWorkspace(queryClient, willId),
    [queryClient, willId],
  );

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreamingContent('');

      const turn = await api.interview.streamMessage(willId, text, {
        onChunk: (delta) => setStreamingContent((c) => c + delta),
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.interview.status(willId) });
      invalidateAfterTurn();

      const status = await api.interview.status(willId);
      setMessages(toChatMessages(status.messages ?? []));

      setStreamingContent('');
      return turn;
    },
  });

  const isInitializing =
    statusQuery.isLoading ||
    (statusQuery.isSuccess && !initializedRef.current) ||
    startMutation.isPending;

  return {
    messages,
    streamingContent,
    status: statusQuery.data,
    isLoading: isInitializing,
    isSending: sendMutation.isPending,
    progressPercent: statusQuery.data?.progressPercent ?? 0,
    sendMessage: (text: string) => sendMutation.mutate(text),
    sendError: sendMutation.error,
  };
}
