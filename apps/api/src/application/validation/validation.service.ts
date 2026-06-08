import { Inject, Injectable } from '@nestjs/common';
import { UserId, WillId } from '@will-maker/shared-kernel';
import {
  ValidationProfile,
  ValidationReport,
  WillValidationService,
} from '@will-maker/will-domain';
import { WILL_VALIDATION_SERVICE } from '../../common/tokens';
import { WillAccessService } from '../wills/will-access.service';

@Injectable()
export class ValidationService {
  constructor(
    @Inject(WILL_VALIDATION_SERVICE)
    private readonly validator: WillValidationService,
    private readonly willAccess: WillAccessService,
  ) {}

  async getReport(
    willIdParam: WillId,
    userId: UserId,
    profile: ValidationProfile = 'finalize',
  ): Promise<ValidationReport> {
    const will = await this.willAccess.loadOwnedWill(willIdParam, userId);

    return profile === 'review'
      ? this.validator.validateForReview(will)
      : this.validator.validateForFinalize(will);
  }
}
