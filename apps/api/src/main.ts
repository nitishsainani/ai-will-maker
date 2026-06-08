import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  const config = app.get(ConfigService);
  const webOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:3000');
  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  const port = config.get<number>('API_PORT', 4000);

  await app.listen(port);
}

bootstrap();
