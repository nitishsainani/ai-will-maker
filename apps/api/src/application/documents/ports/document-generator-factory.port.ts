import { DocumentFormat, DocumentGenerator } from './document-generator.port';

export interface DocumentGeneratorFactoryPort {
  create(format?: DocumentFormat): DocumentGenerator;
  supportedFormats(): DocumentFormat[];
}
