import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { WillDocument } from '@will-maker/will-domain';
import {
  DocumentGenerator,
  GeneratedDocument,
} from '../../application/documents/ports/document-generator.port';

@Injectable()
export class PdfGenerator implements DocumentGenerator {
  readonly format = 'pdf' as const;

  async generate(document: WillDocument): Promise<GeneratedDocument> {
    const buffer = await this.renderPdf(document);

    return {
      format: 'pdf',
      content: buffer,
      mimeType: 'application/pdf',
      filename: `will-${document.willId as string}-r${document.revision}.pdf`,
    };
  }

  private renderPdf(document: WillDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 72, size: 'LETTER' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Last Will and Testament', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor('#444444')
        .text(
          `${document.testatorName} · Revision ${document.revision}`,
          { align: 'center' },
        );
      doc.moveDown(1.5);
      doc.fillColor('#000000');

      for (const section of document.sections) {
        doc.fontSize(13).text(section.title, { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(11).text(section.content, { align: 'left' });
        doc.moveDown(1);
      }

      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(`Generated ${document.generatedAt.toISOString()}`, { align: 'center' });

      doc.end();
    });
  }
}
