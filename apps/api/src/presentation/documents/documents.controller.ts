import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { willId, UserId } from '@will-maker/shared-kernel';
import { GenerateDocumentService } from '../../application/documents/generate-document.service';
import { DocumentFormat } from '../../application/documents/ports/document-generator.port';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../../application/auth/token.service.port';

@Controller('wills/:willId/document')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly generateDocument: GenerateDocumentService) {}

  @Get()
  async download(
    @Param('willId') id: string,
    @Query('format') format: DocumentFormat | undefined,
    @CurrentUser() user: AccessTokenPayload,
    @Res() res: Response,
  ) {
    const result = await this.generateDocument.generate(
      willId(id),
      user.sub as UserId,
      format ?? 'pdf',
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }
}
