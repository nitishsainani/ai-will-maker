import { Injectable } from '@nestjs/common';
import {
  MemoryManager,
  MemoryBuildInput,
  MemoryContext,
  MemoryUpdateInput,
  MemoryUpdateResult,
} from '../../../application/interview/ports/memory-manager.port';
import { loadMemoryConfig, MemoryConfig } from './memory-config';
import {
  buildFactSnapshot,
  estimateContextTokens,
  resolveSystemContent,
  toAiMessages,
} from './memory-strategy.utils';
import { ConfigService } from '@nestjs/config';

/**
 * Full Context Strategy
 * Sends entire message history + full fact snapshot every turn.
 * Best for short conversations; cost grows linearly with turns.
 */
@Injectable()
export class FullContextStrategy implements MemoryManager {
  readonly strategyName = 'full' as const;
  private readonly config: MemoryConfig;

  constructor(configService: ConfigService) {
    this.config = loadMemoryConfig(configService);
  }

  buildContext(input: MemoryBuildInput): MemoryContext {
    const factSnapshot = buildFactSnapshot(input.draftSnapshot);
    const systemContent = resolveSystemContent({
      systemContent: input.systemContent,
      draftSnapshot: factSnapshot,
      currentTopic: input.currentTopic,
      currentQuestion: input.currentQuestion,
    });
    const messages = toAiMessages(systemContent, input.messages);

    return {
      messages,
      factSnapshot,
      buildMode: 'full',
      estimatedTokens: estimateContextTokens(messages, this.config.charsPerToken),
    };
  }

  async updateAfterTurn(input: MemoryUpdateInput): Promise<MemoryUpdateResult> {
    return {
      shouldPersistSnapshot: false,
      strategy: 'full',
      messageCount: input.messages.length,
      factCount: input.newFacts.length,
    };
  }
}
