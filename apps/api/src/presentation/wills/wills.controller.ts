import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { willId, UserId } from '@will-maker/shared-kernel';
import { WillsService } from '../../application/wills/wills.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../../application/auth/token.service.port';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';

@Controller('wills')
@UseGuards(JwtAuthGuard)
export class WillsController {
  constructor(private readonly willsService: WillsService) {}

  @Post()
  async create(
    @Body() dto: CreateWillDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.willsService.create(user.sub as UserId, dto);
  }

  @Get()
  async list(@CurrentUser() user: AccessTokenPayload) {
    return this.willsService.list(user.sub as UserId);
  }

  @Get(':willId')
  async getById(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.willsService.getById(willId(id), user.sub as UserId);
  }

  @Patch(':willId')
  async update(
    @Param('willId') id: string,
    @Body() dto: UpdateWillDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.willsService.update(willId(id), user.sub as UserId, dto);
  }

  @Post(':willId/submit-for-review')
  async submitForReview(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.willsService.submitForReview(willId(id), user.sub as UserId);
  }

  @Post(':willId/finalize')
  async finalize(
    @Param('willId') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.willsService.finalize(willId(id), user.sub as UserId);
  }
}
