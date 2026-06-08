import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiCompletionRequest,
  AiCompletionResponse,
  AiStreamChunk,
  IAIProvider,
} from '../../application/interview/ports/ai-provider.port';
import { logAiRequest, logAiResponse } from './ai-debug.logger';

@Injectable()
export class OpenAIProvider implements IAIProvider {
  readonly providerName = 'openai';
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  private responseFormat(request: AiCompletionRequest) {
    if (request.responseFormat !== 'json') return undefined;
    if (!request.jsonSchema) return { type: 'json_object' as const };

    return {
      type: 'json_schema' as const,
      json_schema: {
        name: 'will_maker_interview_response',
        strict: false,
        schema: request.jsonSchema,
      },
    };
  }

  /** Some models (o-series, gpt-5+) only accept the default temperature. */
  private supportsCustomTemperature(): boolean {
    const model = this.model.toLowerCase();
    if (/^o\d/.test(model)) return false;
    if (/^gpt-5/.test(model)) return false;
    return true;
  }

  private baseParams(request: AiCompletionRequest) {
    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      response_format: this.responseFormat(request),
    };

    if (this.supportsCustomTemperature()) {
      params.temperature = request.temperature ?? 0.3;
    }

    return params;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    logAiRequest(this.providerName, this.model, request, 'complete()');

    const response = await this.client.chat.completions.create(this.baseParams(request));

    const content = response.choices[0]?.message?.content ?? '';
    logAiResponse(this.providerName, this.model, content);

    return {
      content,
      provider: this.providerName,
      model: this.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async *stream(request: AiCompletionRequest): AsyncIterable<AiStreamChunk> {
    logAiRequest(this.providerName, this.model, request, 'stream() — interview uses this');

    const stream = await this.client.chat.completions.create({
      ...this.baseParams(request),
      stream: true,
    });

    let aggregated = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      const done = chunk.choices[0]?.finish_reason != null;
      if (delta) {
        aggregated += delta;
        yield { delta, done: false };
      }
      if (done) {
        logAiResponse(this.providerName, this.model, aggregated);
        yield { delta: '', done: true };
      }
    }
  }
}
