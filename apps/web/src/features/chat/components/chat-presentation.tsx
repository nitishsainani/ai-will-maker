'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardTitle } from '@/shared/ui/card';
import type { ChatMessage } from '../hooks/use-interview-chat';

export interface ChatPresentationProps {
  messages: ChatMessage[];
  streamingContent: string;
  progressPercent: number;
  isSending: boolean;
  onSend: (message: string) => void;
  error?: string;
}

export function ChatPresentation({
  messages,
  streamingContent,
  progressPercent,
  isSending,
  onSend,
  error,
}: ChatPresentationProps) {
  const [input, setInput] = useState('');
  const showPendingAssistant = isSending || streamingContent.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    onSend(text);
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <CardTitle>AI Interview</CardTitle>
        <span className="text-sm text-muted-foreground">{progressPercent}% complete</span>
      </div>
      <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-md border border-border p-4 min-h-[320px] max-h-[480px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'ml-8 bg-primary text-primary-foreground'
                : 'mr-8 bg-muted text-foreground'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {showPendingAssistant && (
          <div className="mr-8 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
            {streamingContent || 'Thinking…'}
            <span className="animate-pulse">▋</span>
          </div>
        )}
      </div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          disabled={isSending}
          className="flex-1"
        />
        <Button type="submit" disabled={isSending}>
          Send
        </Button>
      </form>
    </Card>
  );
}
