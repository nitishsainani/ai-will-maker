import { Module } from '@nestjs/common';
import { UsersService } from '../application/users/users.service';
import { PersistenceModule } from './persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [UsersService],
  exports: [UsersService, PersistenceModule],
})
export class UsersModule {}
