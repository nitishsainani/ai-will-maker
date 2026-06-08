import { WillId, UserId } from '@will-maker/shared-kernel';
import { Will } from '../entities/will.entity';
import { WillStatus } from '../enums';

export interface WillSummary {
  id: WillId;
  userId: UserId;
  title: string;
  status: WillStatus;
  revision: number;
  testatorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindWillOptions {
  includeConversation?: boolean;
}

export interface WillRepository {
  findById(id: WillId, options?: FindWillOptions): Promise<Will | null>;
  findByUserId(userId: UserId): Promise<WillSummary[]>;
  save(will: Will): Promise<void>;
  delete(id: WillId): Promise<void>;
  exists(id: WillId): Promise<boolean>;
}

/** @deprecated Use WillRepository */
export type IWillRepository = WillRepository;
