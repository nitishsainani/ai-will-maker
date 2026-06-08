'use client';

import { WillDetailPanel } from '../components/will-detail-panel';
import { useFinalizeWill } from '../hooks/use-finalize-will';
import { useSubmitWill } from '../hooks/use-submit-will';
import { useUpdateWill } from '../hooks/use-update-will';
import { useWill } from '../hooks/use-wills';

export function WillBuilderContainer({ willId }: { willId: string }) {
  const { data: will, isLoading } = useWill(willId);
  const updateWill = useUpdateWill(willId);
  const submitWill = useSubmitWill(willId);
  const finalizeWill = useFinalizeWill(willId);

  if (isLoading || !will) {
    return <p className="text-sm text-muted-foreground">Loading will…</p>;
  }

  return (
    <WillDetailPanel
      will={will}
      isSaving={updateWill.isPending}
      isTransitioning={submitWill.isPending || finalizeWill.isPending}
      onSave={(patch) => updateWill.mutate(patch)}
      onSubmitForReview={() => submitWill.mutate()}
      onFinalize={() => finalizeWill.mutate()}
    />
  );
}
