import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  conversationId,
  conversationMessageId,
  UserId,
  WillId,
} from '@will-maker/shared-kernel';
import { WillRepository, MessageRole } from '@will-maker/will-domain';
import {
  AI_PROVIDER,
  MEMORY_MANAGER,
  MEMORY_SNAPSHOT_REPOSITORY,
  WILL_REPOSITORY,
} from '../../common/tokens';
import { IAIProvider } from './ports/ai-provider.port';
import { MemoryManager } from './ports/memory-manager.port';
import { MemorySnapshotRepository } from './ports/memory-snapshot.repository.port';
import {
  InterviewStreamEvent,
  InterviewTurnResult,
  StartInterviewResult,
} from './dto/interview-turn-result.dto';
import {
  ConversationMessageDto,
  mapConversationMessages,
} from './interview-message.mapper';
import { WillAccessService } from '../wills/will-access.service';
import { AiSystemPromptBuilder } from './ai-system-prompt.builder';
import { AiResponseParser } from './ai-response.parser';
import {
  isAiDebugEnabled,
  logAiPipelineStage,
} from '../../infrastructure/ai/ai-debug.logger';
import { InterviewDraftService } from './interview-draft.service';
import { DraftHydrationService } from './draft-hydration.service';
import { deriveProgressPercent } from './draft-progress.util';
import { AssistantMessageStreamExtractor } from './assistant-message-stream.extractor';

const START_GREETING =
  "Hello! I'll help you draft your will step by step. Let's start with your full legal name.";

@Injectable()
export class AiInterviewService {
  constructor(
    @Inject(WILL_REPOSITORY)
    private readonly willRepository: WillRepository,
    private readonly willAccess: WillAccessService,
    @Inject(AI_PROVIDER)
    private readonly aiProvider: IAIProvider,
    @Inject(MEMORY_MANAGER)
    private readonly memoryManager: MemoryManager,
    @Inject(MEMORY_SNAPSHOT_REPOSITORY)
    private readonly memorySnapshotRepository: MemorySnapshotRepository,
    private readonly promptBuilder: AiSystemPromptBuilder,
    private readonly responseParser: AiResponseParser,
    private readonly draftService: InterviewDraftService,
    private readonly hydrationService: DraftHydrationService,
    private readonly config: ConfigService,
  ) {}

  async startInterview(willId: WillId, userId: UserId): Promise<StartInterviewResult> {
    const will = await this.willAccess.loadOwnedWill(willId, userId, {
      includeConversation: true,
    });

    const draft = this.draftService.ensureDraft(will);

    const existing = will.getActiveConversation();
    if (existing) {
      const messages = mapConversationMessages(existing);
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      return {
        conversationId: existing.id as string,
        assistantMessage: lastAssistant?.content ?? START_GREETING,
        willDraft: draft,
        missingFields: [],
        messages: this.serializeMessages(messages),
      };
    }

    const providerName = this.config.get<string>('AI_PROVIDER', 'openai');
    const convId = conversationId(randomUUID());
    const startResult = will.startConversation(convId, providerName);
    if (!startResult.ok) {
      throw new UnprocessableEntityException(startResult.error.message);
    }

    const conversation = will.getActiveConversation()!;
    const msgResult = will.addConversationMessage(
      convId,
      conversationMessageId(randomUUID()),
      MessageRole.ASSISTANT,
      START_GREETING,
    );
    if (!msgResult.ok) {
      throw new UnprocessableEntityException(msgResult.error.message);
    }

    await this.willRepository.save(will);

    return {
      conversationId: conversation.id as string,
      assistantMessage: START_GREETING,
      willDraft: draft,
      missingFields: [],
      messages: this.serializeMessages(mapConversationMessages(conversation)),
    };
  }

  async *processMessage(
    willId: WillId,
    userId: UserId,
    userMessage: string,
  ): AsyncIterable<InterviewStreamEvent> {
    const will = await this.willAccess.loadOwnedWill(willId, userId, {
      includeConversation: true,
    });
    const conversation = will.getActiveConversation();

    if (!conversation) {
      throw new NotFoundException('No active interview session. Start an interview first.');
    }

    const currentDraft = this.draftService.getDraft(will);

    const userMsgResult = will.addConversationMessage(
      conversation.id,
      conversationMessageId(randomUUID()),
      MessageRole.USER,
      userMessage,
    );
    if (!userMsgResult.ok) {
      throw new UnprocessableEntityException(userMsgResult.error.message);
    }

    const systemContent = this.promptBuilder.build({
      draft: currentDraft,
      summary: conversation.summary,
    });

    const memoryContext = this.memoryManager.buildContext({
      conversationId: conversation.id as string,
      messages: mapConversationMessages(conversation),
      draftSnapshot: currentDraft as Record<string, unknown>,
      summary: conversation.summary,
      currentTopic: 'interview',
      systemContent,
    });

    if (isAiDebugEnabled()) {
      logAiPipelineStage('interview turn context', {
        willId: willId as string,
        conversationId: conversation.id as string,
        userMessage,
        memoryBuildMode: memoryContext.buildMode,
        estimatedTokens: memoryContext.estimatedTokens,
        systemPrompt: systemContent,
        messagesToProvider: memoryContext.messages,
      });
    }

    let aiRawResponse = '';
    const assistantStream = new AssistantMessageStreamExtractor();

    for await (const chunk of this.aiProvider.stream({
      messages: memoryContext.messages,
      responseFormat: 'json',
      temperature: 0.3,
    })) {
      if (!chunk.delta) continue;
      aiRawResponse += chunk.delta;
      const assistantDelta = assistantStream.push(chunk.delta);
      if (assistantDelta) {
        yield { type: 'assistant_delta', delta: assistantDelta };
      }
    }

    const { response: parsed, parseError } = this.responseParser.parse(aiRawResponse, currentDraft);
    const hasParseError = Boolean(parseError);

    if (!hasParseError) {
      this.draftService.setDraft(will, parsed.willDraft);
    }

    const assistantMessage = parsed.assistantMessage.trim();
    const needsClarification = parsed.needsClarification ?? hasParseError;

    if (assistantMessage) {
      const assistantMsgResult = will.addConversationMessage(
        conversation.id,
        conversationMessageId(randomUUID()),
        MessageRole.ASSISTANT,
        assistantMessage,
      );
      if (!assistantMsgResult.ok) {
        throw new UnprocessableEntityException(assistantMsgResult.error.message);
      }
    }

    const updateResult = await this.memoryManager.updateAfterTurn({
      conversationId: conversation.id as string,
      messages: mapConversationMessages(conversation),
      assistantReply: assistantMessage || aiRawResponse,
      newFacts: [],
      summary: conversation.summary,
    });

    if (updateResult.summary) {
      conversation.setSummary(updateResult.summary);
    }

    if (updateResult.shouldPersistSnapshot && updateResult.summary) {
      await this.memorySnapshotRepository.append({
        conversationId: conversation.id as string,
        summary: updateResult.summary,
        messageCount: updateResult.messageCount,
        factCount: Object.keys(parsed.willDraft).length,
        strategy: updateResult.strategy,
        estimatedTokens: memoryContext.estimatedTokens,
      });
    }

    await this.willRepository.save(will);

    const missingFields = parsed.missingFields ?? [];
    const isComplete = parsed.isComplete ?? false;

    const turnResult: InterviewTurnResult = {
      assistantMessage,
      willDraft: parsed.willDraft,
      needsClarification,
      clarificationPrompt: parsed.clarificationPrompt,
      isComplete,
      missingFields,
      aiResponse: parsed,
      progressPercent: deriveProgressPercent(missingFields, isComplete),
      memory: {
        strategy: this.memoryManager.strategyName,
        buildMode: memoryContext.buildMode,
        estimatedTokens: memoryContext.estimatedTokens,
        messageCount: conversation.messages.length,
        factCount: Object.keys(parsed.willDraft).length,
        hasSummary: Boolean(conversation.summary),
      },
    };

    yield { type: 'done', data: turnResult };
  }

  async getStatus(willId: WillId, userId: UserId) {
    const will = await this.willAccess.loadOwnedWill(willId, userId, {
      includeConversation: true,
    });
    const draft = this.draftService.getDraft(will);
    const conversation = will.getActiveConversation();

    if (!conversation) {
      return {
        active: false,
        progressPercent: 0,
        missingFields: [] as string[],
        willDraft: draft,
        messages: [],
      };
    }

    const memoryContext = this.memoryManager.buildContext({
      conversationId: conversation.id as string,
      messages: mapConversationMessages(conversation),
      draftSnapshot: draft as Record<string, unknown>,
      summary: conversation.summary,
      currentTopic: 'interview',
      systemContent: this.promptBuilder.build({ draft, summary: conversation.summary }),
    });
    const latestSnapshot = await this.memorySnapshotRepository.findLatest(
      conversation.id as string,
    );

    const messages = mapConversationMessages(conversation);

    return {
      active: true,
      conversationId: conversation.id as string,
      progressPercent: 0,
      missingFields: [] as string[],
      willDraft: draft,
      messages: this.serializeMessages(messages),
      isComplete: false,
      memory: {
        strategy: this.memoryManager.strategyName,
        buildMode: memoryContext.buildMode,
        estimatedTokens: memoryContext.estimatedTokens,
        messageCount: conversation.messages.length,
        factCount: Object.keys(draft).length,
        hasSummary: Boolean(conversation.summary),
        summary: conversation.summary ?? undefined,
        latestSnapshotAt: latestSnapshot?.createdAt,
      },
    };
  }

  async syncToWill(willId: WillId, userId: UserId): Promise<void> {
    const will = await this.willAccess.loadOwnedWill(willId, userId, {
      includeConversation: true,
    });

    const draft = this.draftService.getDraft(will);
    this.hydrationService.hydrate(will, draft);
    await this.willRepository.save(will);
  }

  private serializeMessages(messages: ConversationMessageDto[]) {
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
  }
}
