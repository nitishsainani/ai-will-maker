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
 * Rolling Summary Strategy
 * Always sends: compressed summary + recent N messages + full facts.
 * Never sends full history to the model.
 */
@Injectable()
export class RollingSummaryStrategy implements MemoryManager {
  readonly strategyName = 'summary' as const;
  private readonly config: MemoryConfig;

  constructor(
    configService: ConfigService,
    private readonly rollingSummary: RollingSummaryService,
  ) {
    this.config = loadMemoryConfig(configService);
  }

  buildContext(input: MemoryBuildInput): MemoryContext {
    const factSnapshot = buildFactSnapshot(input.draftSnapshot);
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
    const shouldSummarize =
      input.messages.length >= this.config.recentMessageCount;

    if (!shouldSummarize) {
      return {
        summary: input.summary,
        shouldPersistSnapshot: false,
        strategy: 'summary',
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
      strategy: 'summary',
      messageCount: input.messages.length,
      factCount: input.newFacts.length,
    };
  }
}
