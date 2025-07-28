import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Use Cases
import { SendWhatsAppMessageUseCase } from './application/use-cases/send-whatsapp-message.use-case';
import { ProcessWhatsAppWebhookUseCase } from './application/use-cases/process-whatsapp-webhook.use-case';

// Services
import { ProviderSelectionService } from './application/services/provider-selection.service';
import { MessageMappingService } from './application/services/message-mapping.service';
import { WebhookMappingService } from './application/services/webhook-mapping.service';

// Controllers
import { WhatsAppController } from './infrastructure/input-adapters/rest-controllers/whatsapp.controller';

// Repositories
import { InMemoryMessageRepository } from './infrastructure/output-adapters/repositories/in-memory-message.repository';

// Event Publishers
import { ConsoleEventPublisher } from './infrastructure/output-adapters/events/console-event-publisher';

// Ports
import { IMessageRepositoryPort, IEventPublisherPort } from '@omnichannel/messaging-ports';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    })
  ],
  controllers: [
    WhatsAppController
  ],
  providers: [
    // Use Cases
    SendWhatsAppMessageUseCase,
    ProcessWhatsAppWebhookUseCase,
    
    // Application Services
    ProviderSelectionService,
    MessageMappingService,
    WebhookMappingService,
    
    // Repository Implementation
    {
      provide: IMessageRepositoryPort,
      useClass: InMemoryMessageRepository
    },
    
    // Event Publisher Implementation
    {
      provide: IEventPublisherPort,
      useClass: ConsoleEventPublisher
    }
  ],
  exports: [
    SendWhatsAppMessageUseCase,
    ProcessWhatsAppWebhookUseCase,
    ProviderSelectionService
  ]
})
export class WhatsAppModule {}