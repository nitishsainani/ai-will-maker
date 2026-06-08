'use client';

import { Card, CardTitle } from '@/shared/ui/card';
import type { PreviewSection } from '@/shared/lib/preview-sections';

export interface PreviewPresentationProps {
  title: string;
  status: string;
  sections: PreviewSection[];
  html?: string | null;
  isLoading: boolean;
}

export function PreviewPresentation({
  title,
  status,
  sections,
  html,
  isLoading,
}: PreviewPresentationProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading preview…</p>;
  }

  if (html) {
    return (
      <Card className="h-full overflow-hidden">
        <CardTitle className="mb-4">Will Preview — {title}</CardTitle>
        <div
          className="prose prose-sm max-w-none overflow-y-auto max-h-[600px] rounded border border-border p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-y-auto max-h-[600px]">
      <CardTitle className="mb-2">Will Preview — {title}</CardTitle>
      <p className="mb-4 text-xs text-muted-foreground">Status: {status}</p>
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.id}>
            <h3 className="border-b border-border pb-1 text-sm font-semibold">
              {section.title}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </Card>
  );
}
