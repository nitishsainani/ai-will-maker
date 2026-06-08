import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserId, WillId, willId } from '@will-maker/shared-kernel';
import {
  Will,
  WillRepository,
  WillValidationService,
} from '@will-maker/will-domain';
import { WILL_REPOSITORY, WILL_VALIDATION_SERVICE } from '../../common/tokens';
import { WillDetailDto, WillSummaryDto } from './dto/will-detail.dto';
import { WillMapper } from './will.mapper';
import { WillAccessService } from './will-access.service';
import { DraftHydrationService } from '../interview/draft-hydration.service';
import { InterviewDraftService } from '../interview/interview-draft.service';

export interface CreateWillInput {
  title: string;
  testatorName?: string;
}

export interface UpdateWillInput {
  title?: string;
  testatorName?: string;
}

@Injectable()
export class WillsService {
  constructor(
    @Inject(WILL_REPOSITORY)
    private readonly willRepository: WillRepository,
    @Inject(WILL_VALIDATION_SERVICE)
    private readonly validator: WillValidationService,
    private readonly willAccess: WillAccessService,
    private readonly draftService: InterviewDraftService,
    private readonly hydrationService: DraftHydrationService,
  ) {}

  async create(userId: UserId, input: CreateWillInput): Promise<WillDetailDto> {
    const willResult = Will.create({
      id: willId(randomUUID()),
      userId,
      title: input.title,
      testatorName: input.testatorName,
    });

    if (!willResult.ok) {
      throw new UnprocessableEntityException(willResult.error.message);
    }

    await this.willRepository.save(willResult.value);
    return WillMapper.toDetailDto(willResult.value);
  }

  async list(userId: UserId): Promise<WillSummaryDto[]> {
    const summaries = await this.willRepository.findByUserId(userId);
    return summaries.map((s) => WillMapper.toSummaryDto(s));
  }

  async getById(willIdParam: WillId, userId: UserId): Promise<WillDetailDto> {
    const will = await this.willAccess.loadOwnedWill(willIdParam, userId, {
      includeConversation: true,
    });
    return WillMapper.toDetailDto(will);
  }

  async update(
    willIdParam: WillId,
    userId: UserId,
    input: UpdateWillInput,
  ): Promise<WillDetailDto> {
    const will = await this.willAccess.loadOwnedWill(willIdParam, userId, {
      includeConversation: true,
    });

    if (input.title !== undefined) {
      const result = will.updateTitle(input.title);
      if (!result.ok) {
        throw new UnprocessableEntityException(result.error.message);
      }
    }

    if (input.testatorName !== undefined) {
      const result = will.setTestatorName(input.testatorName);
      if (!result.ok) {
        throw new UnprocessableEntityException(result.error.message);
      }
    }

    await this.willRepository.save(will);
    return WillMapper.toDetailDto(will);
  }

  async submitForReview(willIdParam: WillId, userId: UserId): Promise<WillDetailDto> {
    const will = await this.willAccess.loadOwnedWill(willIdParam, userId, {
      includeConversation: true,
    });
    this.hydrationService.hydrate(will, this.draftService.getDraft(will));
    const result = will.submitForReview(this.validator);
    if (!result.ok) {
      throw new UnprocessableEntityException({
        message: result.error.message,
        ...(result.error.details as object),
      });
    }
    await this.willRepository.save(will);
    return WillMapper.toDetailDto(will);
  }

  async finalize(willIdParam: WillId, userId: UserId): Promise<WillDetailDto> {
    const will = await this.willAccess.loadOwnedWill(willIdParam, userId, {
      includeConversation: true,
    });
    this.hydrationService.hydrate(will, this.draftService.getDraft(will));
    const result = will.finalize(this.validator);
    if (!result.ok) {
      throw new UnprocessableEntityException({
        message: result.error.message,
        ...(result.error.details as object),
      });
    }
    await this.willRepository.save(will);
    return WillMapper.toDetailDto(will);
  }
}
