'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardTitle } from '@/shared/ui/card';
import type { WillDetail } from '@/shared/api/types/wills';

export interface WillDetailPanelProps {
  will: WillDetail;
  onSave: (patch: { title?: string; testatorName?: string }) => void;
  onSubmitForReview: () => void;
  onFinalize: () => void;
  isSaving: boolean;
  isTransitioning: boolean;
}

export function WillDetailPanel({
  will,
  onSave,
  onSubmitForReview,
  onFinalize,
  isSaving,
  isTransitioning,
}: WillDetailPanelProps) {
  const [title, setTitle] = useState(will.title);
  const [testatorName, setTestatorName] = useState(will.testatorName ?? '');

  useEffect(() => {
    setTitle(will.title);
    setTestatorName(will.testatorName ?? '');
  }, [will.title, will.testatorName]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSave({ title, testatorName });
  };

  return (
    <Card>
      <CardTitle className="mb-4">Will details</CardTitle>
      <p className="mb-4 text-xs text-muted-foreground">
        Status: {will.status} · Revision {will.revision}
      </p>
      <form onSubmit={handleSave} className="mb-6 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Testator name</label>
          <Input value={testatorName} onChange={(e) => setTestatorName(e.target.value)} />
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </form>
      <div className="space-y-4 border-t border-border pt-4 text-sm">
        <div>
          <h4 className="font-medium">Beneficiaries ({will.beneficiaries.length})</h4>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {will.beneficiaries.map((b) => (
              <li key={b.id}>{b.fullName}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium">Executors ({will.executors.length})</h4>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {will.executors.map((e) => (
              <li key={e.id}>
                {e.fullName}
                {e.isPrimary ? ' (primary)' : ''}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium">Witnesses ({will.witnesses.length})</h4>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {will.witnesses
              .slice()
              .sort((a, b) => a.witnessOrder - b.witnessOrder)
              .map((w) => (
                <li key={w.id}>
                  {w.fullName} — {w.addressLine1}, {w.city}, {w.state}
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {will.status === 'DRAFT' && (
          <Button
            type="button"
            className="bg-muted text-foreground"
            onClick={onSubmitForReview}
            disabled={isTransitioning}
          >
            Submit for review
          </Button>
        )}
        {will.status === 'IN_REVIEW' && (
          <Button type="button" onClick={onFinalize} disabled={isTransitioning}>
            Finalize will
          </Button>
        )}
      </div>
    </Card>
  );
}
