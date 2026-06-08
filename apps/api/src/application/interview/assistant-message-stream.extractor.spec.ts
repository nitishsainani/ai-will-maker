import { describe, expect, it } from 'vitest';
import { AssistantMessageStreamExtractor } from './assistant-message-stream.extractor';

describe('AssistantMessageStreamExtractor', () => {
  it('streams assistantMessage text as JSON arrives in fragments', () => {
    const extractor = new AssistantMessageStreamExtractor();
    const parts = [
      '{"assistantMess',
      'age":"Hello, ',
      'Nitish. What is your age?","willDraft":{',
    ];

    let streamed = '';
    for (const part of parts) {
      streamed += extractor.push(part);
    }

    expect(streamed).toBe('Hello, Nitish. What is your age?');
  });

  it('decodes common JSON string escapes', () => {
    const extractor = new AssistantMessageStreamExtractor();
    const streamed = extractor.push(
      '{"assistantMessage":"Line one\\nLine two\\tDone","willDraft":{}}',
    );
    expect(streamed).toBe('Line one\nLine two\tDone');
  });

  it('returns empty string until assistantMessage key is present', () => {
    const extractor = new AssistantMessageStreamExtractor();
    expect(extractor.push('{"willDraft":{')).toBe('');
    expect(extractor.push('"assistantMessage":"Hi"')).toBe('Hi');
  });

  it('stops after the closing quote', () => {
    const extractor = new AssistantMessageStreamExtractor();
    const first = extractor.push('{"assistantMessage":"Hi","willDraft":');
    const second = extractor.push('{"testator":{}}}');
    expect(first).toBe('Hi');
    expect(second).toBe('');
  });
});
