import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiInterviewService } from '../application/interview/ai-interview.service';
import { AiSystemPromptBuilder } from '../application/interview/ai-system-prompt.builder';
import { AiResponseParser } from '../application/interview/ai-response.parser';
import { AI_PROVIDER, MEMORY_MANAGER } from '../common/tokens';
import { AiProviderFactory } from '../infrastructure/ai/ai-provider.factory';
import { MemoryManagerFactory } from '../infrastructure/interview/memory/memory-manager.factory';
import { RollingSummaryService } from '../infrastructure/interview/memory/rolling-summary.service';
import { InterviewController } from '../presentation/interview/interview.controller';
import { InterviewSseController } from '../presentation/interview/interview.sse.controller';
import { PersistenceModule } from './persistence.module';
import { WillsModule } from './wills.module';

@Module({
  imports: [PersistenceModule, WillsModule],
  controllers: [InterviewController, InterviewSseController],
  providers: [
    AiInterviewService,
    AiSystemPromptBuilder,
    AiResponseParser,
    RollingSummaryService,
    {
      provide: AI_PROVIDER,
      useFactory: (config: ConfigService) => AiProviderFactory.create(config),
      inject: [ConfigService],
    },
    {
      provide: MEMORY_MANAGER,
      useFactory: (config: ConfigService, rollingSummary: RollingSummaryService) =>
        MemoryManagerFactory.create(config, rollingSummary),
      inject: [ConfigService, RollingSummaryService],
    },
  ],
  exports: [AiInterviewService],
})
export class InterviewModule {}
