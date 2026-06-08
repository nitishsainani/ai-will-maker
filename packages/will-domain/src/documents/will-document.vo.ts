import { WillId } from '@will-maker/shared-kernel';

export interface WillDocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface WillDocumentProps {
  willId: WillId;
  revision: number;
  testatorName: string;
  sections: WillDocumentSection[];
}

/**
 * Format-agnostic will document model.
 * Generators (HTML, PDF, future DOCX) render this structure without business logic.
 */
export class WillDocument {
  readonly willId: WillId;
  readonly revision: number;
  readonly testatorName: string;
  readonly sections: readonly WillDocumentSection[];
  readonly generatedAt: Date;

  private constructor(props: WillDocumentProps) {
    this.willId = props.willId;
    this.revision = props.revision;
    this.testatorName = props.testatorName;
    this.sections = [...props.sections].sort((a, b) => a.order - b.order);
    this.generatedAt = new Date();
  }

  static create(props: WillDocumentProps): WillDocument {
    return new WillDocument(props);
  }
}
