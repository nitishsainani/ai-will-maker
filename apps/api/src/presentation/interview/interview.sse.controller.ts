import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { willId, UserId } from '@will-maker/shared-kernel';
import { AiInterviewService } from '../../application/interview/ai-interview.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../../application/auth/token.service.port';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('wills/:willId/interview')
@UseGuards(JwtAuthGuard)
export class InterviewSseController {
  constructor(private readonly interviewEngine: AiInterviewService) {}

  @Post('messages')
  async sendMessage(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of this.interviewEngine.processMessage(
        willId(id),
        user.sub as UserId,
        dto.message,
      )) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Interview processing failed';
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    }

    res.end();
  }
}
