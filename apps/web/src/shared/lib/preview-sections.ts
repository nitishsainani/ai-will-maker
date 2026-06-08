import type { WillDetail } from '@/shared/api/types/wills';

export interface PreviewSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export function buildPreviewSectionsFromWill(will: WillDetail): PreviewSection[] {
  const beneficiaryNameById = new Map(
    will.beneficiaries.map((b) => [b.id, b.fullName]),
  );

  return [
    {
      id: 'declaration',
      title: 'Declaration',
      order: 1,
      content: `I, ${will.testatorName ?? 'Unknown'}, being of sound mind and memory, declare this to be my Last Will and Testament.`,
    },
    {
      id: 'beneficiaries',
      title: 'Beneficiaries',
      order: 2,
      content:
        will.beneficiaries.length > 0
          ? will.beneficiaries
              .map((b) => `• ${b.fullName} (${b.relationship})`)
              .join('\n')
          : 'No beneficiaries named.',
    },
    {
      id: 'bequests',
      title: 'Specific Bequests',
      order: 3,
      content:
        will.assetAllocations.length > 0
          ? will.assetAllocations
              .map((a) => {
                const asset = will.assets.find((x) => x.id === a.assetId);
                const name = beneficiaryNameById.get(a.beneficiaryId) ?? a.beneficiaryId;
                return `• ${asset?.description ?? a.assetId}: ${a.sharePct}% to ${name}`;
              })
              .join('\n')
          : 'No specific asset bequests.',
    },
    {
      id: 'executors',
      title: 'Appointment of Executor',
      order: 4,
      content:
        will.executors.length > 0
          ? will.executors
              .map(
                (e) =>
                  `• ${e.fullName}${e.isPrimary ? ' (Primary)' : ''}${e.email ? ` — ${e.email}` : ''}`,
              )
              .join('\n')
          : 'No executor appointed.',
    },
    {
      id: 'guardians',
      title: 'Guardianship',
      order: 5,
      content:
        will.guardians.length > 0
          ? will.guardians
              .map((g) => {
                const ward = beneficiaryNameById.get(g.wardBeneficiaryId) ?? 'ward';
                return `• Guardian for ${ward}: ${g.fullName} (${g.relationship})`;
              })
              .join('\n')
          : 'No guardians appointed.',
    },
    {
      id: 'witnesses',
      title: 'Attestation and Witnesses',
      order: 6,
      content:
        will.witnesses.length > 0
          ? will.witnesses
              .map(
                (w) =>
                  `• Witness ${w.witnessOrder}: ${w.fullName} — ${w.addressLine1}, ${w.city}, ${w.state}`,
              )
              .join('\n')
          : 'Witness signatures required.',
    },
  ];
}
