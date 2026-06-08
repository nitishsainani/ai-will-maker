export type MemoryFactSource =
  | 'ai_extraction'
  | 'user_confirmation'
  | 'system_inference'
  | 'correction';

export class MemoryFact {
  private constructor(
    readonly key: string,
    readonly value: unknown,
    readonly confidence: number,
    readonly source: MemoryFactSource,
  ) {}

  static create(
    key: string,
    value: unknown,
    confidence: number,
    source: MemoryFactSource = 'ai_extraction',
  ): MemoryFact {
    const clampedConfidence = Math.max(0, Math.min(1, confidence));
    return new MemoryFact(key.trim(), value, clampedConfidence, source);
  }

  static reconstitute(
    key: string,
    value: unknown,
    confidence: number,
    source: MemoryFactSource,
  ): MemoryFact {
    return new MemoryFact(key, value, confidence, source);
  }

  matchesPrefix(prefix: string): boolean {
    return this.key.startsWith(prefix);
  }

  isHighConfidence(threshold = 0.7): boolean {
    return this.confidence >= threshold;
  }
}
