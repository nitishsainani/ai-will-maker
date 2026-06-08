/**
 * Incrementally extracts assistantMessage text from a streaming JSON response.
 */
export class AssistantMessageStreamExtractor {
  private buffer = '';
  private phase: 'seeking' | 'in_string' | 'done' = 'seeking';
  private readPos = 0;

  push(fragment: string): string {
    if (!fragment || this.phase === 'done') return '';
    this.buffer += fragment;
    return this.drain();
  }

  private drain(): string {
    let output = '';

    while (this.readPos < this.buffer.length) {
      if (this.phase === 'seeking') {
        const marker = /"assistantMessage"\s*:\s*"/g;
        marker.lastIndex = 0;
        const match = marker.exec(this.buffer);
        if (!match) break;
        this.readPos = match.index + match[0].length;
        this.phase = 'in_string';
        continue;
      }

      if (this.phase === 'done') break;

      const char = this.buffer[this.readPos];

      if (char === '\\') {
        if (this.readPos + 1 >= this.buffer.length) break;
        output += decodeJsonEscape(this.buffer[this.readPos + 1]);
        this.readPos += 2;
        continue;
      }

      if (char === '"') {
        this.phase = 'done';
        this.readPos += 1;
        break;
      }

      output += char;
      this.readPos += 1;
    }

    return output;
  }
}

function decodeJsonEscape(char: string): string {
  switch (char) {
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case '"':
      return '"';
    case '\\':
      return '\\';
    case '/':
      return '/';
    case 'b':
      return '\b';
    case 'f':
      return '\f';
    default:
      return char;
  }
}
