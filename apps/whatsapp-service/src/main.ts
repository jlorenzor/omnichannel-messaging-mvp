import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WhatsAppModule } from './whatsapp.module';

async function bootstrap() {
  const app = await NestFactory.create(WhatsAppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }));

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('WhatsApp Service API')
    .setDescription('Omnichannel messaging platform - WhatsApp service with Gupshup and Meta providers')
    .setVersion('1.0')
    .addTag('WhatsApp', 'WhatsApp messaging operations')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'whatsapp-service',
      version: '1.0.0'
    });
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  console.log(`🚀 WhatsApp Service is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
}

bootstrap();