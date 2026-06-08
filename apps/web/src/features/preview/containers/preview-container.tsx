'use client';

import { PreviewPresentation } from '../components/preview-presentation';
import { useWillPreview } from '../hooks/use-will-preview';

export function PreviewContainer({ willId }: { willId: string }) {
  const preview = useWillPreview(willId);

  return (
    <PreviewPresentation
      title={preview.will?.title ?? 'Will'}
      status={preview.will?.status ?? 'DRAFT'}
      sections={preview.sections}
      html={preview.html}
      isLoading={preview.isLoading}
    />
  );
}
