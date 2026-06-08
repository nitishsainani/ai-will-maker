import { Injectable } from '@nestjs/common';
import { userId, UserId } from '@will-maker/shared-kernel';
import { UserRepository, User, Email } from '@will-maker/will-domain';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id: id as string } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toString() } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id as string },
      create: {
        id: user.id as string,
        email: user.email.toString(),
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        email: user.email.toString(),
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        updatedAt: user.updatedAt,
      },
    });
  }

  private toDomain(row: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const emailResult = Email.create(row.email);
    if (!emailResult.ok) {
      throw new Error(`Corrupt user email in database: ${row.id}`);
    }

    return User.reconstitute({
      id: userId(row.id),
      email: emailResult.value,
      passwordHash: row.passwordHash,
      fullName: row.fullName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
