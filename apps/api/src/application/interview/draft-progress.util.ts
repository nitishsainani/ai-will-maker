const BASELINE_FIELD_COUNT = 12;

export function deriveProgressPercent(missingFields: string[], isComplete: boolean): number {
  if (isComplete) return 100;
  const remaining = missingFields.length;
  return Math.min(99, Math.max(0, Math.round(((BASELINE_FIELD_COUNT - remaining) / BASELINE_FIELD_COUNT) * 100)));
}
