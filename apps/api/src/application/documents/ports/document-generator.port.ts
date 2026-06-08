import { WillDocument } from '@will-maker/will-domain';

export type DocumentFormat = 'html' | 'pdf' | 'docx';

export interface GeneratedDocument {
  format: DocumentFormat;
  content: Buffer;
  mimeType: string;
  filename: string;
}

export interface DocumentGenerator {
  readonly format: DocumentFormat;
  generate(document: WillDocument): Promise<GeneratedDocument>;
}
