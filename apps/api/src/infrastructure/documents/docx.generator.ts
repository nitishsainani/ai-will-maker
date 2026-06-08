import { Injectable, NotImplementedException } from '@nestjs/common';
import { WillDocument } from '@will-maker/will-domain';
import {
  DocumentGenerator,
  GeneratedDocument,
} from '../../application/documents/ports/document-generator.port';

/**
 * Placeholder for future DOCX support.
 * Register in DocumentGeneratorFactory when implemented — no business logic changes required.
 */
@Injectable()
export class DocxGenerator implements DocumentGenerator {
  readonly format = 'docx' as const;

  async generate(_document: WillDocument): Promise<GeneratedDocument> {
    throw new NotImplementedException(
      'DOCX generation is not yet implemented. Add a DocxGenerator adapter and register it in DocumentGeneratorFactory.',
    );
  }
}
