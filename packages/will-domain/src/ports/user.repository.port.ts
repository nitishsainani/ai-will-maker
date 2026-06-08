import { UserId } from '@will-maker/shared-kernel';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}

/** @deprecated Use UserRepository */
export type IUserRepository = UserRepository;
