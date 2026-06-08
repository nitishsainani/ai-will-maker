import { Injectable } from '@nestjs/common';
import {
  AiInterviewTurnResponse,
  AiInterviewTurnResponseSchema,
  EMPTY_WILL_INTERVIEW_DRAFT,
  PARSE_ERROR_TURN_RESPONSE,
} from '@will-maker/will-contract';
import { normalizeAiResponsePayload } from './schemas/normalize-ai-response';

export interface ParseResult {
  response: AiInterviewTurnResponse;
  parseError?: string;
}

@Injectable()
export class AiResponseParser {
  parse(raw: string, currentDraft?: AiInterviewTurnResponse['willDraft']): ParseResult {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        response: this.parseErrorResponse(currentDraft),
        parseError: 'No JSON object found in response',
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      const normalized = normalizeAiResponsePayload(parsed);
      const result = AiInterviewTurnResponseSchema.safeParse(normalized);

      if (result.success) {
        return { response: result.data };
      }

      return {
        response: this.parseErrorResponse(currentDraft, normalized, result.error.message),
        parseError: result.error.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON';
      return {
        response: this.parseErrorResponse(currentDraft, undefined, message),
        parseError: message,
      };
    }
  }

  private parseErrorResponse(
    currentDraft?: AiInterviewTurnResponse['willDraft'],
    normalized?: unknown,
    _message?: string,
  ): AiInterviewTurnResponse {
    const partial =
      normalized && typeof normalized === 'object'
        ? (normalized as Record<string, unknown>)
        : undefined;
    const assistantMessage =
      typeof partial?.assistantMessage === 'string' && partial.assistantMessage.trim()
        ? partial.assistantMessage.trim()
        : PARSE_ERROR_TURN_RESPONSE.assistantMessage;

    return {
      ...PARSE_ERROR_TURN_RESPONSE,
      assistantMessage,
      clarificationPrompt:
        typeof partial?.clarificationPrompt === 'string'
          ? partial.clarificationPrompt
          : undefined,
      missingFields: Array.isArray(partial?.missingFields)
        ? (partial.missingFields as string[])
        : undefined,
      willDraft: currentDraft ?? { ...EMPTY_WILL_INTERVIEW_DRAFT },
    };
  }
}
