import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { willId, UserId } from '@will-maker/shared-kernel';
import { ValidationProfile } from '@will-maker/will-domain';
import { ValidationService } from '../../application/validation/validation.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../../application/auth/token.service.port';

@Controller('wills/:willId/validation')
@UseGuards(JwtAuthGuard)
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get()
  async getReport(
    @Param('willId') id: string,
    @Query('profile') profile: ValidationProfile | undefined,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.validationService.getReport(
      willId(id),
      user.sub as UserId,
      profile ?? 'finalize',
    );
  }
}
