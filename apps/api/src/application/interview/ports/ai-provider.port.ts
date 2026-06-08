export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  responseFormat: 'text' | 'json';
  temperature?: number;
  jsonSchema?: Record<string, unknown>;
}

export interface AiCompletionResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AiStreamChunk {
  delta: string;
  done: boolean;
}

export interface IAIProvider {
  readonly providerName: string;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
  stream(request: AiCompletionRequest): AsyncIterable<AiStreamChunk>;
}
