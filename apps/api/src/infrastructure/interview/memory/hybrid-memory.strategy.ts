import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { RollingSummaryService } from './rolling-summary.service';

/**
 * Hybrid Strategy (RECOMMENDED DEFAULT)
 *
 * - Short conversations (<= threshold): full message history + full facts
 * - Long conversations: rolling summary + recent N messages + full facts
 *
 * Will draft data from the database is always sent in full — summaries only compress dialogue.
 */
@Injectable()
export class HybridMemoryStrategy implements MemoryManager {
  readonly strategyName = 'hybrid' as const;
  private readonly config: MemoryConfig;

  constructor(
    configService: ConfigService,
    private readonly rollingSummary: RollingSummaryService,
  ) {
    this.config = loadMemoryConfig(configService);
  }

  buildContext(input: MemoryBuildInput): MemoryContext {
    const factSnapshot = buildFactSnapshot(input.draftSnapshot);
    const useFullContext = input.messages.length <= this.config.fullContextThreshold;

    if (useFullContext) {
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

    const recentMessages = input.messages.slice(-this.config.recentMessageCount);
    const systemContent = resolveSystemContent({
      systemContent: input.systemContent,
      draftSnapshot: factSnapshot,
      currentTopic: input.currentTopic,
      summary: input.summary,
      currentQuestion: input.currentQuestion,
    });
    const messages = toAiMessages(systemContent, recentMessages);

    return {
      messages,
      summary: input.summary,
      factSnapshot,
      buildMode: 'compressed',
      estimatedTokens: estimateContextTokens(messages, this.config.charsPerToken),
    };
  }

  async updateAfterTurn(input: MemoryUpdateInput): Promise<MemoryUpdateResult> {
    const exceededThreshold = input.messages.length > this.config.fullContextThreshold;

    if (!exceededThreshold) {
      return {
        summary: input.summary,
        shouldPersistSnapshot: false,
        strategy: 'hybrid',
        messageCount: input.messages.length,
        factCount: input.newFacts.length,
      };
    }

    const messagesSinceThreshold =
      input.messages.length - this.config.fullContextThreshold;
    const shouldRefresh =
      !input.summary ||
      messagesSinceThreshold % this.config.summaryRefreshInterval === 0;

    if (!shouldRefresh) {
      return {
        summary: input.summary,
        shouldPersistSnapshot: false,
        strategy: 'hybrid',
        messageCount: input.messages.length,
        factCount: input.newFacts.length,
      };
    }

    const summary = await this.rollingSummary.compress(
      input.messages,
      input.assistantReply,
      input.summary,
    );

    return {
      summary,
      shouldPersistSnapshot: true,
      strategy: 'hybrid',
      messageCount: input.messages.length,
      factCount: input.newFacts.length,
    };
  }
}
