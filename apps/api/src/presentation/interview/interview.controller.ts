import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { willId, UserId } from '@will-maker/shared-kernel';
import { AiInterviewService } from '../../application/interview/ai-interview.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../../application/auth/token.service.port';

@Controller('wills/:willId/interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewEngine: AiInterviewService) {}

  @Post()
  async start(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.interviewEngine.startInterview(willId(id), user.sub as UserId);
  }

  @Get('status')
  async status(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.interviewEngine.getStatus(willId(id), user.sub as UserId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    await this.interviewEngine.syncToWill(willId(id), user.sub as UserId);
    return { synced: true };
  }
}
