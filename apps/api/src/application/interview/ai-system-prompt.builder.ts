import { Injectable } from '@nestjs/common';
import { WillInterviewDraft } from '@will-maker/will-contract';
import { renderTextContract } from './will-text-contract.renderer';

export interface PromptBuildInput {
  draft: WillInterviewDraft;
  summary?: string;
}

@Injectable()
export class AiSystemPromptBuilder {
  build(input: PromptBuildInput): string {
    return renderTextContract(input.draft, input.summary);
  }
}
