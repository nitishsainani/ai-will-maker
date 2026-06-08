import { Injectable } from '@nestjs/common';
import { WillDocument } from '@will-maker/will-domain';
import {
  DocumentGenerator,
  GeneratedDocument,
} from '../../application/documents/ports/document-generator.port';
import { DocumentHtmlRenderer } from './document-html.renderer';

@Injectable()
export class HtmlGenerator implements DocumentGenerator {
  readonly format = 'html' as const;

  private readonly renderer = new DocumentHtmlRenderer();

  async generate(document: WillDocument): Promise<GeneratedDocument> {
    const html = this.renderer.render(document);

    return {
      format: 'html',
      content: Buffer.from(html, 'utf-8'),
      mimeType: 'text/html; charset=utf-8',
      filename: `will-${document.willId as string}-r${document.revision}.html`,
    };
  }
}
