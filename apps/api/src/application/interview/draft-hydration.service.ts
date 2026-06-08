import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  assetAllocationId,
  assetId,
  beneficiaryId,
  DomainError,
  executorId,
  guardianId,
  Result,
  witnessId,
} from '@will-maker/shared-kernel';
import { WillInterviewDraft } from '@will-maker/will-contract';
import { AssetType, Email, Money, SharePct, Will } from '@will-maker/will-domain';

@Injectable()
export class DraftHydrationService {
  hydrate(will: Will, draft: WillInterviewDraft): void {
    const clearResult = will.clearInterviewCollections();
    if (!clearResult.ok) {
      throw new UnprocessableEntityException(clearResult.error.message);
    }

    if (draft.testator) {
      const result = will.setTestatorDetails({
        fullName: draft.testator.fullName,
        age: draft.testator.age,
        address: draft.testator.address,
        soundMindDeclaration: draft.testator.soundMindDeclaration,
      });
      this.ensureOk(result);
    }

    if (draft.revocation?.revokesPreviousWills !== undefined) {
      this.ensureOk(will.setRevocation(draft.revocation.revokesPreviousWills));
    }

    for (const beneficiary of draft.beneficiaries) {
      if (!beneficiary.fullName) continue;
      const id = beneficiary.id ? beneficiaryId(beneficiary.id) : beneficiaryId(randomUUID());
      this.ensureOk(
        will.addBeneficiary({
          id,
          fullName: beneficiary.fullName,
          relationship: beneficiary.relationship ?? 'unspecified',
          age: beneficiary.age,
          isMinor: beneficiary.isMinor ?? (beneficiary.age !== undefined ? beneficiary.age < 18 : undefined),
          dateOfBirth: beneficiary.dateOfBirth ? new Date(beneficiary.dateOfBirth) : undefined,
          contactEmail: beneficiary.contactEmail,
          addressLine1: beneficiary.addressLine1,
          city: beneficiary.city,
          state: beneficiary.state,
        }),
      );
    }

    for (const asset of draft.assets) {
      if (!asset.description) continue;
      const id = asset.id ? assetId(asset.id) : assetId(randomUUID());
      const money = asset.estimatedValue !== undefined
        ? this.ensureOk(Money.create(asset.estimatedValue, asset.currency ?? 'USD'))
        : undefined;
      this.ensureOk(
        will.addAsset({
          id,
          type: (asset.assetType as AssetType) ?? AssetType.OTHER,
          description: asset.description,
          userLabel: asset.description,
          estimatedValue: money,
          locationOrAccountDetails: asset.locationOrIdentifier,
        }),
      );
    }

    for (const allocation of draft.assetAllocations) {
      if (!allocation.assetId || !allocation.beneficiaryId || allocation.sharePct === undefined) {
        continue;
      }
      const share = this.ensureOk(SharePct.create(allocation.sharePct));
      this.ensureOk(
        will.assignAssetShare(
          assetId(allocation.assetId),
          beneficiaryId(allocation.beneficiaryId),
          share,
          assetAllocationId(allocation.id ?? randomUUID()),
        ),
      );
    }

    if (draft.executor?.fullName) {
      const id = draft.executor.id ? executorId(draft.executor.id) : executorId(randomUUID());
      let email: Email | undefined;
      if (draft.executor.email) {
        email = this.ensureOk(Email.create(draft.executor.email));
      }
      this.ensureOk(
        will.appointExecutor({
          id,
          fullName: draft.executor.fullName,
          email,
          isPrimary: draft.executor.isPrimary ?? true,
          relationship: draft.executor.relationship,
          address: draft.executor.address,
        }),
      );
    }

    if (draft.guardian?.fullName && draft.guardian.relationship) {
      const wardId =
        draft.guardian.wardBeneficiaryId ??
        will.beneficiaries.find((b) => b.fullName === draft.guardian?.wardName)?.id;
      if (wardId) {
        const id = draft.guardian.id ? guardianId(draft.guardian.id) : guardianId(randomUUID());
        this.ensureOk(
          will.nameGuardian(beneficiaryId(wardId as string), {
            id,
            fullName: draft.guardian.fullName,
            relationship: draft.guardian.relationship,
            address: draft.guardian.address,
          }),
        );
      }
    }

    for (const witness of draft.witnesses) {
      if (!witness.fullName) continue;
      const id = witness.id ? witnessId(witness.id) : witnessId(randomUUID());
      this.ensureOk(
        will.addWitness({
          id,
          fullName: witness.fullName,
          addressLine1: witness.addressLine1 ?? witness.address ?? 'unspecified',
          city: witness.city ?? 'unspecified',
          state: witness.state ?? 'unspecified',
          witnessOrder: witness.witnessOrder ?? will.witnesses.length + 1,
          address: witness.address,
          isBeneficiary: witness.isBeneficiary,
        }),
      );
    }

    if (draft.executionDetails) {
      this.ensureOk(
        will.setExecutionDetails({
          date: draft.executionDetails.date ? new Date(draft.executionDetails.date) : undefined,
          place: draft.executionDetails.place,
          testatorSignatureLine: draft.executionDetails.testatorSignatureLine,
          witnessSignatureLines: draft.executionDetails.witnessSignatureLines,
        }),
      );
    }
  }

  private ensureOk<T>(result: Result<T, DomainError>): T {
    if (!result.ok) {
      throw new UnprocessableEntityException(result.error.message);
    }
    return result.value;
  }
}
