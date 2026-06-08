import { Module } from '@nestjs/common';
import { DOCUMENT_GENERATOR_FACTORY } from '../common/tokens';
import { GenerateDocumentService } from '../application/documents/generate-document.service';
import { DocumentGeneratorFactory } from '../infrastructure/documents/document-generator.factory';
import { DocxGenerator } from '../infrastructure/documents/docx.generator';
import { HtmlGenerator } from '../infrastructure/documents/html.generator';
import { PdfGenerator } from '../infrastructure/documents/pdf.generator';
import { DocumentsController } from '../presentation/documents/documents.controller';
import { WillsModule } from './wills.module';

@Module({
  imports: [WillsModule],
  controllers: [DocumentsController],
  providers: [
    GenerateDocumentService,
    HtmlGenerator,
    PdfGenerator,
    DocxGenerator,
    DocumentGeneratorFactory,
    {
      provide: DOCUMENT_GENERATOR_FACTORY,
      useExisting: DocumentGeneratorFactory,
    },
  ],
  exports: [GenerateDocumentService],
})
export class DocumentsModule {}
