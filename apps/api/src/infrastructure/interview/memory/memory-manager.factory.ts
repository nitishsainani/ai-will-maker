import { ConfigService } from '@nestjs/config';
import { MemoryManager } from '../../../application/interview/ports/memory-manager.port';
import { FullContextStrategy } from './full-context.strategy';
import { HybridMemoryStrategy } from './hybrid-memory.strategy';
import { RollingSummaryStrategy } from './rolling-summary.strategy';
import { RollingSummaryService } from './rolling-summary.service';

export class MemoryManagerFactory {
  static create(
    config: ConfigService,
    rollingSummary: RollingSummaryService,
  ): MemoryManager {
    const strategy = config.get<string>('MEMORY_STRATEGY', 'hybrid').toLowerCase();

    switch (strategy) {
      case 'full':
        return new FullContextStrategy(config);
      case 'summary':
        return new RollingSummaryStrategy(config, rollingSummary);
      case 'hybrid':
      default:
        return new HybridMemoryStrategy(config, rollingSummary);
    }
  }
}
