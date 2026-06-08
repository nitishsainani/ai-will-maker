import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '@will-maker/shared-kernel';

@Catch(Object)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (!this.isDomainError(exception)) {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.mapStatus(exception);
    const body = {
      statusCode: status,
      code: exception.code,
      message: exception.message,
      details: exception.details ?? undefined,
    };

    response.status(status).json(body);
  }

  private isDomainError(exception: unknown): exception is DomainError {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      'message' in exception
    );
  }

  private mapStatus(error: DomainError): number {
    switch (error.code) {
      case 'VALIDATION_FAILED':
      case 'INVALID_EMAIL':
      case 'INVALID_ALLOCATION':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'ENTITY_NOT_FOUND':
      case 'WILL_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'CONCURRENCY_CONFLICT':
        return HttpStatus.CONFLICT;
      default:
        if (error.message.toLowerCase().includes('already exists')) {
          return HttpStatus.CONFLICT;
        }
        if (error.message.toLowerCase().includes('invalid credentials')) {
          return HttpStatus.UNAUTHORIZED;
        }
        return HttpStatus.BAD_REQUEST;
    }
  }
}

export function throwFromDomainError(error: DomainError): never {
  switch (error.code) {
    case 'VALIDATION_FAILED':
    case 'INVALID_EMAIL':
      throw new UnprocessableEntityException(error.message);
    default:
      if (error.message.toLowerCase().includes('already exists')) {
        throw new ConflictException(error.message);
      }
      if (error.message.toLowerCase().includes('invalid credentials')) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnprocessableEntityException(error.message);
  }
}
