import { WillId, UserId, BeneficiaryId } from '@will-maker/shared-kernel';

export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}

export class WillCreatedEvent implements DomainEvent {
  readonly type = 'WillCreated';
  readonly occurredAt = new Date();

  constructor(
    readonly willId: WillId,
    readonly userId: UserId,
  ) {}
}

export class BeneficiaryRemovedEvent implements DomainEvent {
  readonly type = 'BeneficiaryRemoved';
  readonly occurredAt = new Date();

  constructor(
    readonly willId: WillId,
    readonly beneficiaryId: BeneficiaryId,
  ) {}
}

export class WillFinalizedEvent implements DomainEvent {
  readonly type = 'WillFinalized';
  readonly occurredAt = new Date();

  constructor(
    readonly willId: WillId,
    readonly revision: number,
  ) {}
}

export class WillStatusChangedEvent implements DomainEvent {
  readonly type = 'WillStatusChanged';
  readonly occurredAt = new Date();

  constructor(
    readonly willId: WillId,
    readonly from: string,
    readonly to: string,
  ) {}
}
