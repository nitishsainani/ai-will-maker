import { Global, Module } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  MEMORY_SNAPSHOT_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
  WILL_REPOSITORY,
} from '../common/tokens';
import { ConversationPrismaPersistence } from '../infrastructure/persistence/conversation-prisma.persistence';
import { PrismaService } from '../infrastructure/persistence/prisma.service';
import { PrismaConversationRepository } from '../infrastructure/persistence/repositories/prisma-conversation.repository';
import { PostgresRefreshTokenRepository } from '../infrastructure/persistence/repositories/postgres-refresh-token.repository';
import { PrismaUserRepository } from '../infrastructure/persistence/repositories/prisma-user.repository';
import { PostgresMemorySnapshotRepository } from '../infrastructure/persistence/repositories/postgres-memory-snapshot.repository';
import { PrismaWillRepository } from '../infrastructure/persistence/repositories/prisma-will.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    ConversationPrismaPersistence,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PostgresRefreshTokenRepository,
    },
    {
      provide: WILL_REPOSITORY,
      useClass: PrismaWillRepository,
    },
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PrismaConversationRepository,
    },
    {
      provide: MEMORY_SNAPSHOT_REPOSITORY,
      useClass: PostgresMemorySnapshotRepository,
    },
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    WILL_REPOSITORY,
    CONVERSATION_REPOSITORY,
    MEMORY_SNAPSHOT_REPOSITORY,
  ],
})
export class PersistenceModule {}
