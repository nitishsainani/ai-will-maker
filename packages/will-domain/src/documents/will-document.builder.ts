import { Will } from '../entities/will.entity';
import { WillSnapshot } from '../value-objects/will-snapshot.vo';
import { WillDocument, WillDocumentSection } from './will-document.vo';

interface BeneficiaryRow {
  id: string;
  fullName: string;
  relationship: string;
  priorityOrder: number;
  dateOfBirth?: string;
}

interface SectionSource {
  testatorName: string;
  beneficiaries: BeneficiaryRow[];
  assets: Array<{ id: string; description: string; type: string }>;
  assetAllocations: Array<{
    assetId: string;
    beneficiaryId: string;
    sharePct: number;
  }>;
  executors: Array<{
    fullName: string;
    email?: string;
    isPrimary: boolean;
    order: number;
  }>;
  guardians: Array<{ wardName: string; fullName: string; relationship: string }>;
  witnesses: Array<{ fullName: string; address: string; witnessOrder: number }>;
}

export class WillDocumentBuilder {
  fromWill(will: Will): WillDocument {
    const beneficiaryNameById = new Map(
      will.beneficiaries.map((b) => [b.id as string, b.fullName]),
    );

    return WillDocument.create({
      willId: will.id,
      revision: will.revision,
      testatorName: will.testatorName ?? 'Unknown',
      sections: this.buildSections({
        testatorName: will.testatorName ?? 'Unknown',
        beneficiaries: will.beneficiaries.map((b) => ({
          id: b.id as string,
          fullName: b.fullName,
          relationship: b.relationship,
          priorityOrder: b.priorityOrder,
          dateOfBirth: b.dateOfBirth?.toISOString(),
        })),
        assets: will.assets.map((a) => ({
          id: a.id as string,
          description: a.description,
          type: a.type,
        })),
        assetAllocations: will.assetAllocations.map((a) => ({
          assetId: a.assetId as string,
          beneficiaryId: a.beneficiaryId as string,
          sharePct: a.sharePct.value,
        })),
        executors: will.executors.map((e) => ({
          fullName: e.fullName,
          email: e.email?.toString(),
          isPrimary: e.isPrimary,
          order: e.order,
        })),
        guardians: will.guardians.map((g) => ({
          wardName: beneficiaryNameById.get(g.wardBeneficiaryId as string) ?? 'Unknown ward',
          fullName: g.fullName,
          relationship: g.relationship,
        })),
        witnesses: will.witnesses.map((w) => ({
          fullName: w.fullName,
          address: `${w.addressLine1}, ${w.city}, ${w.state}`,
          witnessOrder: w.witnessOrder,
        })),
      }),
    });
  }

  fromSnapshot(snapshot: WillSnapshot): WillDocument {
    const beneficiaryNameById = new Map(
      snapshot.beneficiaries.map((b) => [b.id, b.fullName]),
    );

    return WillDocument.create({
      willId: snapshot.willId,
      revision: snapshot.revision,
      testatorName: snapshot.testatorName,
      sections: this.buildSections({
        testatorName: snapshot.testatorName,
        beneficiaries: snapshot.beneficiaries.map((b) => ({
          id: b.id,
          fullName: b.fullName,
          relationship: b.relationship,
          priorityOrder: b.priorityOrder,
          dateOfBirth: b.dateOfBirth,
        })),
        assets: snapshot.assets.map((a) => ({
          id: a.id,
          description: a.description,
          type: a.type,
        })),
        assetAllocations: snapshot.assetAllocations,
        executors: snapshot.executors,
        guardians: snapshot.guardians.map((g) => ({
          wardName: beneficiaryNameById.get(g.wardBeneficiaryId) ?? 'Unknown ward',
          fullName: g.fullName,
          relationship: g.relationship,
        })),
        witnesses: snapshot.witnesses.map((w) => ({
          fullName: w.fullName,
          address: `${w.addressLine1}, ${w.city}, ${w.state}`,
          witnessOrder: w.witnessOrder,
        })),
      }),
    });
  }

  private buildSections(data: SectionSource): WillDocumentSection[] {
    const beneficiaryNameById = new Map(
      data.beneficiaries.map((b) => [b.id, b.fullName]),
    );

    const sections: WillDocumentSection[] = [];

    sections.push({
      id: 'declaration',
      title: 'Declaration',
      order: 1,
      content: `I, ${data.testatorName}, being of sound mind and memory, declare this to be my Last Will and Testament.`,
    });

    sections.push({
      id: 'beneficiaries',
      title: 'Beneficiaries',
      order: 2,
      content:
        data.beneficiaries.length > 0
          ? data.beneficiaries
              .map(
                (b) =>
                  `• ${b.fullName} (${b.relationship})` +
                  (b.dateOfBirth ? ` — born ${b.dateOfBirth}` : ''),
              )
              .join('\n')
          : 'No beneficiaries named.',
    });

    const assetById = new Map(data.assets.map((a) => [a.id, a]));
    const bequestLines = data.assetAllocations.map((alloc) => {
      const asset = assetById.get(alloc.assetId);
      const beneficiary =
        beneficiaryNameById.get(alloc.beneficiaryId) ?? alloc.beneficiaryId;
      const assetDesc = asset ? `${asset.description} (${asset.type})` : alloc.assetId;
      return `• ${assetDesc}: ${alloc.sharePct}% to ${beneficiary}`;
    });

    sections.push({
      id: 'specific-bequests',
      title: 'Specific Bequests',
      order: 3,
      content:
        bequestLines.length > 0
          ? bequestLines.join('\n')
          : 'No specific asset bequests.',
    });

    const executorLines = [...data.executors]
      .sort((a, b) => a.order - b.order)
      .map(
        (e) =>
          `• ${e.fullName}${e.isPrimary ? ' (Primary Executor)' : ''}` +
          (e.email ? ` — ${e.email}` : ''),
      );

    sections.push({
      id: 'executors',
      title: 'Appointment of Executor',
      order: 4,
      content:
        executorLines.length > 0
          ? executorLines.join('\n')
          : 'No executor appointed.',
    });

    const guardianLines = data.guardians.map(
      (g) => `• Guardian for ${g.wardName}: ${g.fullName} (${g.relationship})`,
    );

    sections.push({
      id: 'guardians',
      title: 'Guardianship',
      order: 5,
      content:
        guardianLines.length > 0
          ? guardianLines.join('\n')
          : 'No guardians appointed.',
    });

    const witnessLines = [...data.witnesses]
      .sort((a, b) => a.witnessOrder - b.witnessOrder)
      .map((w) => `• Witness ${w.witnessOrder}: ${w.fullName} — ${w.address}`);

    sections.push({
      id: 'witnesses',
      title: 'Attestation and Witnesses',
      order: 6,
      content: [
        'IN WITNESS WHEREOF, I have signed this Will on the date below.',
        witnessLines.length > 0 ? witnessLines.join('\n') : 'Witness signatures required.',
      ].join('\n\n'),
    });

    return sections;
  }
}
