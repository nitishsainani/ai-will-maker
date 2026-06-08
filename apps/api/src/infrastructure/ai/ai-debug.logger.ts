import { AiCompletionRequest } from '../../application/interview/ports/ai-provider.port';

export function isAiDebugEnabled(): boolean {
  return process.env.AI_DEBUG === 'true' || process.env.AI_DEBUG === '1';
}

export function logAiRequest(
  provider: string,
  model: string,
  request: AiCompletionRequest,
  note?: string,
): void {
  if (!isAiDebugEnabled()) return;

  const payload = {
    provider,
    model,
    temperature: request.temperature ?? 0.3,
    response_format:
      request.responseFormat === 'json'
        ? request.jsonSchema
          ? {
              type: 'json_schema',
              json_schema: {
                name: 'will_maker_interview_response',
                strict: false,
                schema: request.jsonSchema,
              },
            }
          : { type: 'json_object' }
        : undefined,
    messages: request.messages,
    ...(note ? { note } : {}),
  };

  console.log('\n========== AI REQUEST ==========');
  console.log(JSON.stringify(payload, null, 2));
  console.log('================================\n');
}

export function logAiResponse(provider: string, model: string, content: string): void {
  if (!isAiDebugEnabled()) return;

  let parsed: unknown = content;
  try {
    parsed = JSON.parse(content);
  } catch {
    // keep raw string
  }

  console.log('\n========== AI RESPONSE (aggregated) ==========');
  console.log(
    JSON.stringify(
      {
        provider,
        model,
        rawLength: content.length,
        content: parsed,
      },
      null,
      2,
    ),
  );
  console.log('==============================================\n');
}

export function logAiPipelineStage(
  stage: string,
  data: Record<string, unknown>,
): void {
  if (!isAiDebugEnabled()) return;

  // console.log(`\n---------- AI PIPELINE: ${stage} ----------`);
  // console.log(JSON.stringify(data, null, 2));
  // console.log('-------------------------------------------\n');
}
