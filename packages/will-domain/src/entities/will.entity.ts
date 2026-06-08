import {
  AssetAllocationId,
  AssetId,
  BeneficiaryId,
  ConversationId,
  ConversationMemoryId,
  ConversationMessageId,
  DomainError,
  ExecutorId,
  GuardianId,
  Result,
  UserId,
  WillId,
  WitnessId,
  domainError,
  fail,
  ok,
} from '@will-maker/shared-kernel';
import { WillStatus, AssetType, ConversationStatus, MessageRole } from '../enums';
import {
  BeneficiaryRemovedEvent,
  DomainEvent,
  WillCreatedEvent,
  WillFinalizedEvent,
  WillStatusChangedEvent,
} from '../events/domain-events';
import { WillValidationService } from '../services/will-validation.service';
import { ConversationMemoryMapper } from '../services/conversation-memory-mapper.service';
import { Email } from '../value-objects/email.vo';
import { Money } from '../value-objects/money.vo';
import { MemoryFact } from '../value-objects/memory-fact.vo';
import { SharePct, sumSharePcts } from '../value-objects/share-pct.vo';
import { WillSnapshot } from '../value-objects/will-snapshot.vo';
import { Asset } from './asset.entity';
import { AssetAllocation } from './asset-allocation.entity';
import { Beneficiary } from './beneficiary.entity';
import { Conversation } from './conversation.entity';
import { Executor } from './executor.entity';
import { Guardian } from './guardian.entity';
import { Witness } from './witness.entity';

const ASSET_SHARE_TOLERANCE = 0.01;

export interface CreateWillProps {
  id: WillId;
  userId: UserId;
  title: string;
  testatorName?: string;
}

export interface ReconstituteWillProps {
  id: WillId;
  userId: UserId;
  title: string;
  status: WillStatus;
  revision: number;
  testatorName?: string;
  testatorAge?: number;
  testatorAddress?: string;
  soundMindDeclaration?: boolean;
  revokesPreviousWills?: boolean;
  executionDate?: Date;
  executionPlace?: string;
  testatorSignatureLine?: boolean;
  witnessSignatureLines?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  beneficiaries: Beneficiary[];
  assets: Asset[];
  assetAllocations: AssetAllocation[];
  executors: Executor[];
  guardians: Guardian[];
  witnesses: Witness[];
  conversations: Conversation[];
}

export interface AddBeneficiaryProps {
  id: BeneficiaryId;
  fullName: string;
  relationship: string;
  priorityOrder?: number;
  dateOfBirth?: Date;
  contactEmail?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  age?: number;
  isMinor?: boolean;
}

export interface AddAssetProps {
  id: AssetId;
  type: AssetType;
  description: string;
  userLabel?: string;
  estimatedValue?: Money;
  locationOrAccountDetails?: string;
}

export interface AppointExecutorProps {
  id: ExecutorId;
  fullName: string;
  email?: Email;
  isPrimary?: boolean;
  order?: number;
  relationship?: string;
  address?: string;
}

export interface NameGuardianProps {
  id: GuardianId;
  fullName: string;
  relationship: string;
  address?: string;
}

export interface AddWitnessProps {
  id: WitnessId;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  witnessOrder: number;
  address?: string;
  isBeneficiary?: boolean;
}

export class Will {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    readonly id: WillId,
    readonly userId: UserId,
    private _title: string,
    private _status: WillStatus,
    private _revision: number,
    private _testatorName: string | undefined,
    private _testatorAge: number | undefined,
    private _testatorAddress: string | undefined,
    private _soundMindDeclaration: boolean | undefined,
    private _revokesPreviousWills: boolean | undefined,
    private _executionDate: Date | undefined,
    private _executionPlace: string | undefined,
    private _testatorSignatureLine: boolean | undefined,
    private _witnessSignatureLines: boolean | undefined,
    private _metadata: Record<string, unknown>,
    readonly createdAt: Date,
    private _updatedAt: Date,
    private _beneficiaries: Beneficiary[],
    private _assets: Asset[],
    private _assetAllocations: AssetAllocation[],
    private _executors: Executor[],
    private _guardians: Guardian[],
    private _witnesses: Witness[],
    private _conversations: Conversation[],
  ) {}

  static create(props: CreateWillProps): Result<Will, DomainError> {
    const now = new Date();
    const will = new Will(
      props.id,
      props.userId,
      props.title.trim(),
      WillStatus.DRAFT,
      1,
      props.testatorName?.trim(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {},
      now,
      now,
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    );
    will._domainEvents.push(new WillCreatedEvent(props.id, props.userId));
    return ok(will);
  }

  static reconstitute(props: ReconstituteWillProps): Will {
    return new Will(
      props.id,
      props.userId,
      props.title,
      props.status,
      props.revision,
      props.testatorName,
      props.testatorAge,
      props.testatorAddress,
      props.soundMindDeclaration,
      props.revokesPreviousWills,
      props.executionDate,
      props.executionPlace,
      props.testatorSignatureLine,
      props.witnessSignatureLines,
      props.metadata ?? {},
      props.createdAt,
      props.updatedAt,
      props.beneficiaries,
      props.assets,
      props.assetAllocations,
      props.executors,
      props.guardians,
      props.witnesses,
      props.conversations,
    );
  }

  get title(): string {
    return this._title;
  }

  get status(): WillStatus {
    return this._status;
  }

  get revision(): number {
    return this._revision;
  }

  get testatorName(): string | undefined {
    return this._testatorName;
  }

  get testatorAge(): number | undefined {
    return this._testatorAge;
  }

  get testatorAddress(): string | undefined {
    return this._testatorAddress;
  }

  get soundMindDeclaration(): boolean | undefined {
    return this._soundMindDeclaration;
  }

  get revokesPreviousWills(): boolean | undefined {
    return this._revokesPreviousWills;
  }

  get executionDate(): Date | undefined {
    return this._executionDate;
  }

  get executionPlace(): string | undefined {
    return this._executionPlace;
  }

  get testatorSignatureLine(): boolean | undefined {
    return this._testatorSignatureLine;
  }

  get witnessSignatureLines(): boolean | undefined {
    return this._witnessSignatureLines;
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return this._metadata;
  }

  getInterviewDraft(): unknown {
    return this._metadata.interviewDraft;
  }

  setInterviewDraft(draft: unknown): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    this._metadata = { ...this._metadata, interviewDraft: draft };
    this.touch();
    return ok(undefined);
  }

  clearInterviewCollections(): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    this._beneficiaries = [];
    this._assets = [];
    this._assetAllocations = [];
    this._executors = [];
    this._guardians = [];
    this._witnesses = [];
    this.touch();
    return ok(undefined);
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  belongsTo(userId: UserId): boolean {
    return (this.userId as string) === (userId as string);
  }

  get beneficiaries(): readonly Beneficiary[] {
    return this._beneficiaries;
  }

  get assets(): readonly Asset[] {
    return this._assets;
  }

  get assetAllocations(): readonly AssetAllocation[] {
    return this._assetAllocations;
  }

  get executors(): readonly Executor[] {
    return this._executors;
  }

  get guardians(): readonly Guardian[] {
    return this._guardians;
  }

  get witnesses(): readonly Witness[] {
    return this._witnesses;
  }

  get conversations(): readonly Conversation[] {
    return this._conversations;
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  ensureEditable(): Result<void, DomainError> {
    if (this._status === WillStatus.FINALIZED) {
      return fail(domainError('WILL_NOT_EDITABLE', 'Finalized wills cannot be modified'));
    }
    return ok(undefined);
  }

  updateTitle(title: string): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    this._title = title.trim();
    this.touch();
    return ok(undefined);
  }

  setTestatorName(name: string): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    this._testatorName = name.trim();
    this.touch();
    return ok(undefined);
  }

  setTestatorDetails(props: {
    fullName?: string;
    age?: number;
    address?: string;
    soundMindDeclaration?: boolean;
  }): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    if (props.fullName !== undefined) this._testatorName = props.fullName.trim();
    if (props.age !== undefined) this._testatorAge = props.age;
    if (props.address !== undefined) this._testatorAddress = props.address.trim();
    if (props.soundMindDeclaration !== undefined) {
      this._soundMindDeclaration = props.soundMindDeclaration;
    }
    this.touch();
    return ok(undefined);
  }

  setRevocation(revokesPreviousWills: boolean): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    this._revokesPreviousWills = revokesPreviousWills;
    this.touch();
    return ok(undefined);
  }

  setExecutionDetails(props: {
    date?: Date;
    place?: string;
    testatorSignatureLine?: boolean;
    witnessSignatureLines?: boolean;
  }): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;
    if (props.date !== undefined) this._executionDate = props.date;
    if (props.place !== undefined) this._executionPlace = props.place.trim();
    if (props.testatorSignatureLine !== undefined) {
      this._testatorSignatureLine = props.testatorSignatureLine;
    }
    if (props.witnessSignatureLines !== undefined) {
      this._witnessSignatureLines = props.witnessSignatureLines;
    }
    this.touch();
    return ok(undefined);
  }

  addBeneficiary(props: AddBeneficiaryProps): Result<BeneficiaryId, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const beneficiary = Beneficiary.create({
      id: props.id,
      willId: this.id,
      fullName: props.fullName,
      relationship: props.relationship,
      priorityOrder: props.priorityOrder,
      dateOfBirth: props.dateOfBirth,
      age: props.age,
      isMinor: props.isMinor,
      contactEmail: props.contactEmail,
      addressLine1: props.addressLine1,
      city: props.city,
      state: props.state,
    });
    this._beneficiaries.push(beneficiary);
    this.touch();
    return ok(beneficiary.id);
  }

  updateBeneficiary(
    id: BeneficiaryId,
    props: Partial<{
      fullName: string;
      relationship: string;
      dateOfBirth: Date;
      age: number;
      isMinor: boolean;
      contactEmail: string;
      addressLine1: string;
      city: string;
      state: string;
    }>,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const beneficiary = this._beneficiaries.find((b) => b.id === id);
    if (!beneficiary) {
      return fail(domainError('BENEFICIARY_NOT_FOUND', 'Beneficiary not found', { id }));
    }

    if (props.fullName) beneficiary.rename(props.fullName);
    if (props.relationship) beneficiary.updateRelationship(props.relationship);
    if (props.dateOfBirth) beneficiary.setDateOfBirth(props.dateOfBirth);
    if (props.age !== undefined) beneficiary.setAge(props.age);
    if (props.isMinor !== undefined) beneficiary.setIsMinor(props.isMinor);
    beneficiary.updateContact(props.contactEmail, props.addressLine1, props.city, props.state);
    this.touch();
    return ok(undefined);
  }

  removeBeneficiary(id: BeneficiaryId): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const index = this._beneficiaries.findIndex((b) => b.id === id);
    if (index === -1) {
      return fail(domainError('BENEFICIARY_NOT_FOUND', 'Beneficiary not found', { id }));
    }

    this._beneficiaries.splice(index, 1);
    this._assetAllocations = this._assetAllocations.filter((a) => a.beneficiaryId !== id);
    this._guardians = this._guardians.filter((g) => g.wardBeneficiaryId !== id);

    this._domainEvents.push(new BeneficiaryRemovedEvent(this.id, id));
    this.touch();
    return ok(undefined);
  }

  addAsset(props: AddAssetProps): Result<AssetId, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const asset = Asset.create({
      id: props.id,
      willId: this.id,
      type: props.type,
      description: props.description,
      userLabel: props.userLabel,
      estimatedValue: props.estimatedValue,
      locationOrAccountDetails: props.locationOrAccountDetails,
    });
    this._assets.push(asset);
    this.touch();
    return ok(asset.id);
  }

  updateAsset(
    id: AssetId,
    props: Partial<{
      type: AssetType;
      description: string;
      userLabel: string;
      estimatedValue: Money;
      locationOrAccountDetails: string;
    }>,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const asset = this._assets.find((a) => a.id === id);
    if (!asset) {
      return fail(domainError('ASSET_NOT_FOUND', 'Asset not found', { id }));
    }

    if (props.description) asset.updateDescription(props.description);
    if (props.userLabel !== undefined) asset.updateUserLabel(props.userLabel);
    if (props.type) asset.changeType(props.type);
    if (props.locationOrAccountDetails !== undefined) {
      asset.updateLocationOrAccountDetails(props.locationOrAccountDetails);
    }
    if (props.estimatedValue) {
      const revalueResult = asset.revalue(props.estimatedValue);
      if (!revalueResult.ok) return revalueResult;
    }
    this.touch();
    return ok(undefined);
  }

  removeAsset(id: AssetId): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const index = this._assets.findIndex((a) => a.id === id);
    if (index === -1) {
      return fail(domainError('ASSET_NOT_FOUND', 'Asset not found', { id }));
    }

    this._assets.splice(index, 1);
    this._assetAllocations = this._assetAllocations.filter((a) => a.assetId !== id);
    this.touch();
    return ok(undefined);
  }

  assignAssetShare(
    assetId: AssetId,
    beneficiaryId: BeneficiaryId,
    sharePct: SharePct,
    allocationId: AssetAllocationId,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const asset = this._assets.find((a) => a.id === assetId);
    if (!asset) {
      return fail(domainError('ASSET_NOT_FOUND', 'Asset not found', { assetId }));
    }

    const beneficiary = this._beneficiaries.find((b) => b.id === beneficiaryId);
    if (!beneficiary) {
      return fail(domainError('BENEFICIARY_NOT_FOUND', 'Beneficiary not found', { beneficiaryId }));
    }

    if (asset.willId !== this.id || beneficiary.willId !== this.id) {
      return fail(
        domainError('VALIDATION_FAILED', 'Asset and beneficiary must belong to this will'),
      );
    }

    const existing = this._assetAllocations.find((a) => a.matches(assetId, beneficiaryId));
    if (existing) {
      existing.updateShare(sharePct);
    } else {
      const allocationResult = AssetAllocation.create({
        id: allocationId,
        willId: this.id,
        assetId,
        beneficiaryId,
        sharePct,
      });
      if (!allocationResult.ok) return allocationResult;
      this._assetAllocations.push(allocationResult.value);
    }

    const shareValidation = this.validateAssetShares(assetId);
    if (!shareValidation.ok) return shareValidation;

    this.touch();
    return ok(undefined);
  }

  removeAssetShare(assetId: AssetId, beneficiaryId: BeneficiaryId): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const index = this._assetAllocations.findIndex((a) => a.matches(assetId, beneficiaryId));
    if (index === -1) {
      return fail(domainError('ALLOCATION_NOT_FOUND', 'Asset allocation not found'));
    }

    this._assetAllocations.splice(index, 1);
    this.touch();
    return ok(undefined);
  }

  appointExecutor(props: AppointExecutorProps): Result<ExecutorId, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    if (props.isPrimary) {
      this._executors.forEach((e) => e.demote());
    }

    const executor = Executor.create({
      id: props.id,
      willId: this.id,
      fullName: props.fullName,
      email: props.email,
      isPrimary: props.isPrimary,
      order: props.order,
      relationship: props.relationship,
      address: props.address,
    });
    this._executors.push(executor);
    this.touch();
    return ok(executor.id);
  }

  updateExecutor(
    id: ExecutorId,
    props: Partial<{
      fullName: string;
      email: Email;
      isPrimary: boolean;
      relationship: string;
      address: string;
    }>,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const executor = this._executors.find((e) => e.id === id);
    if (!executor) {
      return fail(domainError('EXECUTOR_NOT_FOUND', 'Executor not found', { id }));
    }

    if (props.fullName) executor.rename(props.fullName);
    if (props.email) executor.updateEmail(props.email);
    if (props.relationship !== undefined) executor.updateRelationship(props.relationship);
    if (props.address !== undefined) executor.updateAddress(props.address);
    if (props.isPrimary) {
      this._executors.forEach((e) => e.demote());
      executor.markPrimary();
    }
    this.touch();
    return ok(undefined);
  }

  removeExecutor(id: ExecutorId): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const index = this._executors.findIndex((e) => e.id === id);
    if (index === -1) {
      return fail(domainError('EXECUTOR_NOT_FOUND', 'Executor not found', { id }));
    }

    this._executors.splice(index, 1);
    this.touch();
    return ok(undefined);
  }

  nameGuardian(wardBeneficiaryId: BeneficiaryId, props: NameGuardianProps): Result<GuardianId, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const ward = this._beneficiaries.find((b) => b.id === wardBeneficiaryId);
    if (!ward) {
      return fail(domainError('BENEFICIARY_NOT_FOUND', 'Ward beneficiary not found', { wardBeneficiaryId }));
    }

    const guardianResult = Guardian.forWard(ward, {
      id: props.id,
      fullName: props.fullName,
      relationship: props.relationship,
      address: props.address,
    });
    if (!guardianResult.ok) return guardianResult;

    const existingIndex = this._guardians.findIndex((g) => g.wardBeneficiaryId === wardBeneficiaryId);
    if (existingIndex >= 0) {
      this._guardians[existingIndex] = guardianResult.value;
    } else {
      this._guardians.push(guardianResult.value);
    }

    this.touch();
    return ok(guardianResult.value.id);
  }

  removeGuardian(id: GuardianId): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const index = this._guardians.findIndex((g) => g.id === id);
    if (index === -1) {
      return fail(domainError('GUARDIAN_NOT_FOUND', 'Guardian not found', { id }));
    }

    this._guardians.splice(index, 1);
    this.touch();
    return ok(undefined);
  }

  addWitness(props: AddWitnessProps): Result<WitnessId, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const witnessResult = Witness.create({
      id: props.id,
      willId: this.id,
      fullName: props.fullName,
      addressLine1: props.addressLine1,
      city: props.city,
      state: props.state,
      witnessOrder: props.witnessOrder,
      address: props.address,
      isBeneficiary: props.isBeneficiary,
    });
    if (!witnessResult.ok) return witnessResult;

    const duplicateOrder = this._witnesses.some(
      (w) => w.witnessOrder === props.witnessOrder && w.id !== props.id,
    );
    if (duplicateOrder) {
      return fail(
        domainError('VALIDATION_FAILED', `Witness order ${props.witnessOrder} is already assigned`),
      );
    }

    this._witnesses.push(witnessResult.value);
    this.touch();
    return ok(witnessResult.value.id);
  }

  updateWitness(
    id: WitnessId,
    props: Partial<{
      fullName: string;
      addressLine1: string;
      city: string;
      state: string;
      witnessOrder: number;
      address: string;
      isBeneficiary: boolean;
    }>,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const witness = this._witnesses.find((w) => w.id === id);
    if (!witness) {
      return fail(domainError('WITNESS_NOT_FOUND', 'Witness not found', { id }));
    }

    if (props.fullName) witness.rename(props.fullName);
    if (props.addressLine1 && props.city && props.state) {
      witness.updateAddress(props.addressLine1, props.city, props.state);
    }
    if (props.address !== undefined) witness.updateContractAddress(props.address);
    if (props.isBeneficiary !== undefined) witness.updateIsBeneficiary(props.isBeneficiary);
    this.touch();
    return ok(undefined);
  }

  removeWitness(id: WitnessId): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const index = this._witnesses.findIndex((w) => w.id === id);
    if (index === -1) {
      return fail(domainError('WITNESS_NOT_FOUND', 'Witness not found', { id }));
    }

    this._witnesses.splice(index, 1);
    this.touch();
    return ok(undefined);
  }

  startConversation(conversationId: ConversationId, aiProvider: string): Result<ConversationId, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const active = this._conversations.find((c) => c.status === ConversationStatus.ACTIVE);
    if (active) {
      return fail(domainError('VALIDATION_FAILED', 'An active conversation already exists for this will'));
    }

    const conversation = Conversation.create({
      id: conversationId,
      willId: this.id,
      aiProvider,
    });
    this._conversations.push(conversation);
    this.touch();
    return ok(conversation.id);
  }

  getActiveConversation(): Conversation | undefined {
    return this._conversations.find(
      (c) => c.status === ConversationStatus.ACTIVE || c.status === ConversationStatus.PAUSED,
    );
  }

  addConversationMessage(
    conversationId: ConversationId,
    messageId: ConversationMessageId,
    role: MessageRole,
    content: string,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const conversation = this._conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      return fail(domainError('CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId }));
    }

    const result = conversation.addMessage(messageId, role, content);
    if (!result.ok) return result;

    this.touch();
    return ok(undefined);
  }

  recordMemory(
    conversationId: ConversationId,
    memoryId: ConversationMemoryId,
    fact: MemoryFact,
  ): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const conversation = this._conversations.find((c) => c.id === conversationId);
    if (!conversation) {
      return fail(domainError('CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId }));
    }

    const result = conversation.addMemory(memoryId, fact);
    if (!result.ok) return result;

    this.touch();
    return ok(undefined);
  }

  applyMemoriesToDraft(mapper: ConversationMemoryMapper = new ConversationMemoryMapper()): Result<void, DomainError> {
    const editable = this.ensureEditable();
    if (!editable.ok) return editable;

    const activeConversation = this._conversations.find(
      (c) => c.status === ConversationStatus.ACTIVE || c.status === ConversationStatus.PAUSED,
    );
    if (!activeConversation) {
      return fail(domainError('CONVERSATION_NOT_FOUND', 'No active or paused conversation to apply'));
    }

    const memories = activeConversation.getActiveMemories();
    return mapper.applyToWill(this, memories);
  }

  submitForReview(validator: WillValidationService): Result<void, DomainError> {
    if (this._status !== WillStatus.DRAFT) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Only draft wills can be submitted for review', {
        from: this._status,
        to: WillStatus.IN_REVIEW,
      }));
    }

    const validation = validator.validateForReview(this);
    if (!validation.isValid) {
      return fail(
        domainError('VALIDATION_FAILED', 'Will failed review validation', {
          errors: validation.errors,
          warnings: validation.warnings,
          completionIssues: validation.completionIssues,
        }),
      );
    }

    const from = this._status;
    this._status = WillStatus.IN_REVIEW;
    this._domainEvents.push(new WillStatusChangedEvent(this.id, from, this._status));
    this.touch();
    return ok(undefined);
  }

  requestChanges(): Result<void, DomainError> {
    if (this._status !== WillStatus.IN_REVIEW) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Only wills in review can be sent back to draft', {
        from: this._status,
        to: WillStatus.DRAFT,
      }));
    }

    const from = this._status;
    this._status = WillStatus.DRAFT;
    this._domainEvents.push(new WillStatusChangedEvent(this.id, from, this._status));
    this.touch();
    return ok(undefined);
  }

  finalize(validator: WillValidationService): Result<WillSnapshot, DomainError> {
    if (this._status !== WillStatus.IN_REVIEW) {
      return fail(domainError('INVALID_STATUS_TRANSITION', 'Only wills in review can be finalized', {
        from: this._status,
        to: WillStatus.FINALIZED,
      }));
    }

    const validation = validator.validateForFinalize(this);
    if (!validation.isValid) {
      return fail(
        domainError('VALIDATION_FAILED', 'Will failed finalization validation', {
          errors: validation.errors,
          warnings: validation.warnings,
          completionIssues: validation.completionIssues,
        }),
      );
    }

    const from = this._status;
    this._status = WillStatus.FINALIZED;
    const nextRevision = this._revision + 1;
    this._domainEvents.push(new WillStatusChangedEvent(this.id, from, this._status));
    this._domainEvents.push(new WillFinalizedEvent(this.id, nextRevision));

    const snapshot = this.buildSnapshotForRevision(nextRevision);
    this.touch();
    return ok(snapshot);
  }

  buildSnapshot(): WillSnapshot {
    return this.buildSnapshotForRevision(this._revision);
  }

  private buildSnapshotForRevision(revision: number): WillSnapshot {
    return WillSnapshot.create({
      willId: this.id,
      revision,
      testatorName: this._testatorName ?? '',
      beneficiaries: this._beneficiaries.map((b) => ({
        id: b.id as string,
        fullName: b.fullName,
        relationship: b.relationship,
        priorityOrder: b.priorityOrder,
        dateOfBirth: b.dateOfBirth?.toISOString(),
      })),
      assets: this._assets.map((a) => ({
        id: a.id as string,
        type: a.type,
        description: a.description,
        estimatedValue: a.estimatedValue?.amount,
        currency: a.estimatedValue?.currency ?? 'USD',
      })),
      assetAllocations: this._assetAllocations.map((a) => ({
        id: a.id as string,
        assetId: a.assetId as string,
        beneficiaryId: a.beneficiaryId as string,
        sharePct: a.sharePct.value,
      })),
      executors: this._executors.map((e) => ({
        id: e.id as string,
        fullName: e.fullName,
        email: e.email?.toString(),
        isPrimary: e.isPrimary,
        order: e.order,
      })),
      guardians: this._guardians.map((g) => ({
        id: g.id as string,
        wardBeneficiaryId: g.wardBeneficiaryId as string,
        fullName: g.fullName,
        relationship: g.relationship,
      })),
      witnesses: this._witnesses.map((w) => ({
        id: w.id as string,
        fullName: w.fullName,
        addressLine1: w.addressLine1,
        city: w.city,
        state: w.state,
        witnessOrder: w.witnessOrder,
      })),
    });
  }

  markRevisionIncremented(): void {
    this._revision += 1;
    this.touch();
  }

  private validateAssetShares(assetId: AssetId): Result<void, DomainError> {
    const shares = this._assetAllocations
      .filter((a) => a.assetId === assetId)
      .map((a) => a.sharePct);
    const total = sumSharePcts(shares);
    if (total > 100 + ASSET_SHARE_TOLERANCE) {
      return fail(
        domainError('INVALID_ASSET_SHARE_SUM', `Asset share allocations exceed 100% (got ${total}%)`, {
          assetId,
          total,
        }),
      );
    }
    return ok(undefined);
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
