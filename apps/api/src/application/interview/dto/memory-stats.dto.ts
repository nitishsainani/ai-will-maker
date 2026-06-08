export interface MemoryStatsDto {
  strategy: string;
  buildMode: 'full' | 'compressed';
  estimatedTokens: number;
  messageCount: number;
  factCount: number;
  hasSummary: boolean;
}
