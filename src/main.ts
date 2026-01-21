import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const requestLogger = new Logger('HTTP');

  // Log all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const { method, originalUrl, body } = req;
    const startTime = Date.now();

    requestLogger.log(`→ ${method} ${originalUrl}`);
    if (Object.keys(body || {}).length > 0) {
      requestLogger.debug(`  Body: ${JSON.stringify(body)}`);
    }

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const statusColor = statusCode >= 400 ? 'ERROR' : 'LOG';
      if (statusCode >= 400) {
        requestLogger.error(`← ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
      } else {
        requestLogger.log(`← ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
      }
    });

    next();
  });

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Enable validation for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Leadtech CRM API')
    .setDescription('API documentation for Leadtech CRM Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Optional: Add global prefix like /api
  // app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
