import { WillInterviewDraft } from '@will-maker/will-contract';
import { INTERVIEW_RULES_TEXT, OUTPUT_CONTRACT_TEXT } from './ai-text-contract.constants';

export function renderTextContract(draft: WillInterviewDraft, summary?: string): string {
  const summaryBlock = summary
    ? `\n\nCONVERSATION SUMMARY (older turns):\n${summary}`
    : '';

  const currentDraftBlock = `\n\nCURRENT WILL DRAFT (JSON):\n${JSON.stringify(draft, null, 2)}`;

  return [
    INTERVIEW_RULES_TEXT,
    OUTPUT_CONTRACT_TEXT,
    summaryBlock,
    currentDraftBlock,
  ].join('\n');
}
