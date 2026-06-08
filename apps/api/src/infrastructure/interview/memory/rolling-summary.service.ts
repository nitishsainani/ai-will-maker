import { Injectable, Inject } from '@nestjs/common';
import { IAIProvider } from '../../../application/interview/ports/ai-provider.port';
import { ConversationMessageDto } from '../../../application/interview/ports/memory-manager.port';
import { AI_PROVIDER } from '../../../common/tokens';
import {
  buildSummaryUserContent,
  SUMMARY_SYSTEM_PROMPT,
} from './memory-strategy.utils';

@Injectable()
export class RollingSummaryService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider) {}

  async compress(
    messages: ConversationMessageDto[],
    assistantReply: string,
    previousSummary?: string,
  ): Promise<string> {
    const response = await this.aiProvider.complete({
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildSummaryUserContent(messages, assistantReply, previousSummary),
        },
      ],
      responseFormat: 'text',
      temperature: 0.2,
    });

    return response.content.trim();
  }
}
