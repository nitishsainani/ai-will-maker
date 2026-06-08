import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserId, WillId } from '@will-maker/shared-kernel';
import { FindWillOptions, Will, WillRepository } from '@will-maker/will-domain';
import { WILL_REPOSITORY } from '../../common/tokens';

/**
 * Centralizes will ownership checks — single place to evolve authorization rules.
 */
@Injectable()
export class WillAccessService {
  constructor(
    @Inject(WILL_REPOSITORY)
    private readonly willRepository: WillRepository,
  ) {}

  async loadOwnedWill(
    willId: WillId,
    userId: UserId,
    options?: FindWillOptions,
  ): Promise<Will> {
    const will = await this.willRepository.findById(willId, options);
    if (!will) {
      throw new NotFoundException('Will not found');
    }
    if (!will.belongsTo(userId)) {
      throw new ForbiddenException('You do not have access to this will');
    }
    return will;
  }
}
