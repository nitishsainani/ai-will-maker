import { WillId } from '@will-maker/shared-kernel';

export interface WillVersionRecord {
  id: string;
  willId: WillId;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdAt: Date;
}

export interface IWillVersionRepository {
  save(version: WillVersionRecord): Promise<void>;
  findLatest(willId: WillId): Promise<WillVersionRecord | null>;
  findByNumber(willId: WillId, version: number): Promise<WillVersionRecord | null>;
}
