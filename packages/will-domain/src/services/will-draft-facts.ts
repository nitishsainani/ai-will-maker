/** Fact keys whose values are persisted on will DB tables — never in conversation memories. */
export function isWillDraftFactKey(key: string): boolean {
  return (
    key === 'testator.name' ||
    key === 'beneficiary.relationship' ||
    key.startsWith('beneficiary.') ||
    key.startsWith('executor.') ||
    key.startsWith('asset.') ||
    key.startsWith('guardian.') ||
    key.startsWith('witness.')
  );
}
