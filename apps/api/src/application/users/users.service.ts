import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserId } from '@will-maker/shared-kernel';
import { UserRepository, User } from '@will-maker/will-domain';
import { USER_REPOSITORY } from '../../common/tokens';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getProfile(id: UserId): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id as string,
      email: user.email.toString(),
      fullName: user.fullName,
      createdAt: user.createdAt,
    };
  }
}
