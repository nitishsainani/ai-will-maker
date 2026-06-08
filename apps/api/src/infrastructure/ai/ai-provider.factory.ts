import { ConfigService } from '@nestjs/config';
import { IAIProvider } from '../../application/interview/ports/ai-provider.port';
import { ClaudeProvider } from './claude.provider';
import { OpenAIProvider } from './openai.provider';

export class AiProviderFactory {
  static create(config: ConfigService): IAIProvider {
    const provider = config.get<string>('AI_PROVIDER', 'openai').toLowerCase();

    switch (provider) {
      case 'claude':
        return new ClaudeProvider(config);
      case 'openai':
      default:
        return new OpenAIProvider(config);
    }
  }
}
