import { Global, Module } from '@nestjs/common';
import { WillValidationService } from '@will-maker/will-domain';
import { WILL_VALIDATION_SERVICE } from '../common/tokens';
import { ValidationService } from '../application/validation/validation.service';
import { WillsService } from '../application/wills/wills.service';
import { WillAccessService } from '../application/wills/will-access.service';
import { InterviewDraftService } from '../application/interview/interview-draft.service';
import { DraftHydrationService } from '../application/interview/draft-hydration.service';
import { ValidationController } from '../presentation/validation/validation.controller';
import { WillsController } from '../presentation/wills/wills.controller';
import { PersistenceModule } from './persistence.module';

@Global()
@Module({
  imports: [PersistenceModule],
  controllers: [WillsController, ValidationController],
  providers: [
    WillsService,
    ValidationService,
    WillAccessService,
    InterviewDraftService,
    DraftHydrationService,
    {
      provide: WILL_VALIDATION_SERVICE,
      useClass: WillValidationService,
    },
  ],
  exports: [
    WillsService,
    ValidationService,
    WillAccessService,
    InterviewDraftService,
    DraftHydrationService,
    WILL_VALIDATION_SERVICE,
  ],
})
export class WillsModule {}
