import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentFormat,
  DocumentGenerator,
} from '../../application/documents/ports/document-generator.port';
import { DocumentGeneratorFactoryPort } from '../../application/documents/ports/document-generator-factory.port';
import { DocxGenerator } from './docx.generator';
import { HtmlGenerator } from './html.generator';
import { PdfGenerator } from './pdf.generator';

@Injectable()
export class DocumentGeneratorFactory implements DocumentGeneratorFactoryPort {
  private readonly generators: Map<DocumentFormat, DocumentGenerator>;

  constructor(
    private readonly config: ConfigService,
    htmlGenerator: HtmlGenerator,
    pdfGenerator: PdfGenerator,
    docxGenerator: DocxGenerator,
  ) {
    this.generators = new Map<DocumentFormat, DocumentGenerator>([
      ['html', htmlGenerator],
      ['pdf', pdfGenerator],
      ['docx', docxGenerator],
    ]);
  }

  create(format?: DocumentFormat): DocumentGenerator {
    const resolved =
      format ??
      (this.config.get<string>('DOCUMENT_FORMAT', 'pdf').toLowerCase() as DocumentFormat);

    const generator = this.generators.get(resolved);
    if (!generator) {
      throw new BadRequestException(
        `Unsupported document format: ${resolved}. Supported: html, pdf, docx`,
      );
    }

    return generator;
  }

  supportedFormats(): DocumentFormat[] {
    return [...this.generators.keys()];
  }
}
