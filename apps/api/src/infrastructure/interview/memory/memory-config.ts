import { ConfigService } from '@nestjs/config';

export interface MemoryConfig {
  strategy: 'full' | 'summary' | 'hybrid';
  /** Messages included in rolling/hybrid compressed mode */
  recentMessageCount: number;
  /** Hybrid: use full history below this message count */
  fullContextThreshold: number;
  /** Hybrid/summary: trigger summary refresh every N new messages */
  summaryRefreshInterval: number;
  /** Approx chars per token for estimation */
  charsPerToken: number;
}

export function loadMemoryConfig(config: ConfigService): MemoryConfig {
  return {
    strategy: config.get<string>('MEMORY_STRATEGY', 'hybrid').toLowerCase() as MemoryConfig['strategy'],
    recentMessageCount: config.get<number>('MEMORY_RECENT_MESSAGE_COUNT', 6),
    fullContextThreshold: config.get<number>('MEMORY_FULL_CONTEXT_THRESHOLD', 12),
    summaryRefreshInterval: config.get<number>('MEMORY_SUMMARY_REFRESH_INTERVAL', 4),
    charsPerToken: config.get<number>('MEMORY_CHARS_PER_TOKEN', 4),
  };
}
