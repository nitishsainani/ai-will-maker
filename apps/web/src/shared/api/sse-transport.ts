import { ApiError } from './errors';
import type { InterviewStreamEvent } from './types/interview';
import type { TokenStore } from './token-store';

export async function streamInterviewMessage(
  baseUrl: string,
  willId: string,
  message: string,
  tokenStore: TokenStore,
  onEvent: (event: InterviewStreamEvent) => void,
): Promise<void> {
  const token = tokenStore.getAccessToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/wills/${willId}/interview/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError('No response body', response.status);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const dispatchLine = (line: string) => {
    if (!line.startsWith('data: ')) return;
    const payload = line.slice(6).trim();
    if (!payload) return;
    const event = JSON.parse(payload) as InterviewStreamEvent;
    onEvent(event);
  };

  const dispatchBufferedLines = () => {
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      try {
        dispatchLine(line);
      } catch (error) {
        if (error instanceof SyntaxError) {
          continue;
        }
        throw error;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: !done });
    }
    dispatchBufferedLines();
    if (done) {
      buffer += decoder.decode();
      if (buffer.trim()) {
        try {
          dispatchLine(buffer.trim());
        } catch (error) {
          if (!(error instanceof SyntaxError)) {
            throw error;
          }
        }
      }
      break;
    }
  }
}
