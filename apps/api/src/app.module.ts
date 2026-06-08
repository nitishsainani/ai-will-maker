import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth.module';
import { DocumentsModule } from './modules/documents.module';
import { InterviewModule } from './modules/interview.module';
import { PersistenceModule } from './modules/persistence.module';
import { UsersModule } from './modules/users.module';
import { WillsModule } from './modules/wills.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PersistenceModule,
    UsersModule,
    AuthModule,
    WillsModule,
    InterviewModule,
    DocumentsModule,
  ],
})
export class AppModule {}
