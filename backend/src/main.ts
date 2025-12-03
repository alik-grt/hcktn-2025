import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logLevels: LogLevel[] = (process.env.LOG_LEVEL || 'log,error,warn')
    .split(',')
    .map((level) => level.trim() as LogLevel)
    .filter((level) => ['log', 'error', 'warn', 'debug', 'verbose'].includes(level));

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();
  const port = process.env.BACKEND_PORT || 3000;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Log levels: ${logLevels.join(', ')}`);
}

bootstrap();
