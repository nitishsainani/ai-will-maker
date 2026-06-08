import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WillId, UserId } from '@will-maker/shared-kernel';
import {
  WillDocumentBuilder,
  WillStatus,
  WillValidationService,
} from '@will-maker/will-domain';
import { DOCUMENT_GENERATOR_FACTORY, WILL_VALIDATION_SERVICE } from '../../common/tokens';
import { WillAccessService } from '../wills/will-access.service';
import { DocumentFormat, GeneratedDocument } from './ports/document-generator.port';
import { DocumentGeneratorFactoryPort } from './ports/document-generator-factory.port';

@Injectable()
export class GenerateDocumentService {
  private readonly documentBuilder = new WillDocumentBuilder();

  constructor(
    private readonly willAccess: WillAccessService,
    @Inject(WILL_VALIDATION_SERVICE)
    private readonly validator: WillValidationService,
    @Inject(DOCUMENT_GENERATOR_FACTORY)
    private readonly generatorFactory: DocumentGeneratorFactoryPort,
  ) {}

  async generate(
    willId: WillId,
    userId: UserId,
    format: DocumentFormat,
  ): Promise<GeneratedDocument> {
    const will = await this.willAccess.loadOwnedWill(willId, userId);

    if (will.status !== WillStatus.FINALIZED) {
      throw new UnprocessableEntityException(
        'Will must be finalized before generating a document',
      );
    }

    const validation = this.validator.validateForFinalize(will);
    if (!validation.isValid) {
      throw new UnprocessableEntityException({
        message: 'Will failed validation; document cannot be generated',
        completionIssues: validation.completionIssues,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const willDocument = this.documentBuilder.fromWill(will);
    const generator = this.generatorFactory.create(format);
    return generator.generate(willDocument);
  }
}
