import './tracing';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  const config = new DocumentBuilder()
    .setTitle('Micro_V5 API')
    .setDescription('REST/JSON API for the Micro_V5 web client')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Swagger UI at /docs, OpenAPI JSON at /docs-json
  SwaggerModule.setup('docs', app, document);

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
