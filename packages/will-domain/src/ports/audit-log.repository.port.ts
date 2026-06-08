import { UserId, WillId } from '@will-maker/shared-kernel';

export interface Page {
  offset: number;
  limit: number;
}

export interface AuditLogEntry {
  id: string;
  willId: WillId;
  actorUserId: UserId;
  action: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface IAuditLogRepository {
  append(entry: AuditLogEntry): Promise<void>;
  findByWillId(willId: WillId, pagination: Page): Promise<AuditLogEntry[]>;
}
