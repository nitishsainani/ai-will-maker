import { z } from 'zod';
import { WillInterviewDraftSchema } from './will-draft.schema';

export const AiInterviewTurnResponseSchema = z
  .object({
    assistantMessage: z.string(),
    willDraft: WillInterviewDraftSchema,
    needsClarification: z.boolean().optional(),
    clarificationPrompt: z.string().optional(),
    isComplete: z.boolean().optional(),
    missingFields: z.array(z.string()).optional(),
  })
  .strict();

export type AiInterviewTurnResponse = z.infer<typeof AiInterviewTurnResponseSchema>;

export const PARSE_ERROR_TURN_RESPONSE: AiInterviewTurnResponse = {
  assistantMessage:
    'I had trouble processing that. Could you please try again?',
  willDraft: {
    beneficiaries: [],
    assets: [],
    assetAllocations: [],
    witnesses: [],
  },
  needsClarification: true,
};
