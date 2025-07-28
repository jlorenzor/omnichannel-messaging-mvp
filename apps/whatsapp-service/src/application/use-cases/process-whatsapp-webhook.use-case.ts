import { Injectable } from '@nestjs/common';
import { IProcessWebhookPort, ProcessWebhookCommand, ProcessWebhookResult } from '@omnichannel/messaging-ports';
import { ProviderSelectionService } from '../services/provider-selection.service';
import { WebhookMappingService } from '../services/webhook-mapping.service';
import { IMessageRepositoryPort } from '@omnichannel/messaging-ports';
import { IEventPublisherPort, WebhookReceivedEvent, MessageDeliveredEvent } from '@omnichannel/messaging-ports';
import { MessageId, MessageStatus } from '@omnichannel/domain';

@Injectable()
export class ProcessWhatsAppWebhookUseCase implements IProcessWebhookPort {
  constructor(
    private readonly providerSelection: ProviderSelectionService,
    private readonly webhookMapping: WebhookMappingService,
    private readonly messageRepository: IMessageRepositoryPort,
    private readonly eventPublisher: IEventPublisherPort
  ) {}

  async execute(command: ProcessWebhookCommand): Promise<ProcessWebhookResult> {
    try {
      // 1. Get provider adapter
      const provider = this.providerSelection.getProviderByType(command.provider);
      
      // 2. Validate webhook signature
      const isValid = await provider.validateWebhook(command.payload, command.signature);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // 3. Normalize webhook event
      const normalizedEvent = this.webhookMapping.normalizeEvent(command.provider, command.payload);
      
      // 4. Process event based on type
      const result = await this.processEvent(normalizedEvent);

      // 5. Publish webhook received event
      await this.publishWebhookEvent(command, normalizedEvent);

      return {
        eventType: result.eventType,
        messageId: result.messageId,
        processed: true,
        normalizedEvent: normalizedEvent
      };
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      return {
        eventType: 'error_event' as any,
        processed: false,
        errors: [error.message]
      };
    }
  }

  private async processEvent(event: any): Promise<{ eventType: string; messageId?: string }> {
    switch (event.eventType) {
      case 'message_status':
        return await this.processStatusUpdate(event);
      
      case 'message_received':
        return await this.processIncomingMessage(event);
      
      case 'delivery_receipt':
        return await this.processDeliveryReceipt(event);
      
      case 'read_receipt':
        return await this.processReadReceipt(event);
      
      default:
        console.log(`Unhandled event type: ${event.eventType}`);
        return { eventType: event.eventType };
    }
  }

  private async processStatusUpdate(event: any): Promise<{ eventType: string; messageId: string }> {
    if (!event.messageId) {
      throw new Error('Message ID is required for status updates');
    }

    const messageId = MessageId.fromString(event.messageId);
    const message = await this.messageRepository.findById(messageId);
    
    if (!message) {
      console.warn(`Message not found for status update: ${event.messageId}`);
      return { eventType: 'message_status', messageId: event.messageId };
    }

    // Update message status based on webhook event
    const newStatus = this.mapEventStatusToMessageStatus(event.status);
    
    try {
      message.updateStatus(newStatus);
      
      // Add specific metadata based on status
      switch (newStatus.value) {
        case 'delivered':
          message.markAsDelivered();
          break;
        case 'read':
          message.markAsRead();
          break;
        case 'failed':
          message.markAsFailed(event.error || 'Delivery failed');
          break;
      }
      
      await this.messageRepository.save(message);
      
      // Publish status change event
      if (newStatus.isDelivered()) {
        await this.publishDeliveredEvent(message);
      }
      
    } catch (error) {
      console.error(`Failed to update message status: ${error.message}`);
    }

    return { eventType: 'message_status', messageId: event.messageId };
  }

  private async processIncomingMessage(event: any): Promise<{ eventType: string; messageId?: string }> {
    // For MVP, we just log incoming messages
    // In full implementation, we'd create new conversations/messages
    console.log('Incoming message received:', {
      from: event.phoneNumber,
      messageId: event.messageId,
      timestamp: event.timestamp
    });

    return { eventType: 'message_received', messageId: event.messageId };
  }

  private async processDeliveryReceipt(event: any): Promise<{ eventType: string; messageId: string }> {
    return await this.processStatusUpdate({ ...event, status: 'delivered' });
  }

  private async processReadReceipt(event: any): Promise<{ eventType: string; messageId: string }> {
    return await this.processStatusUpdate({ ...event, status: 'read' });
  }

  private mapEventStatusToMessageStatus(status: string): MessageStatus {
    const statusMap: Record<string, () => MessageStatus> = {
      'sent': () => MessageStatus.sent(),
      'delivered': () => MessageStatus.delivered(),
      'read': () => MessageStatus.read(),
      'failed': () => MessageStatus.failed(),
      'enroute': () => MessageStatus.sent() // Gupshup specific
    };

    const statusCreator = statusMap[status?.toLowerCase()];
    return statusCreator ? statusCreator() : MessageStatus.pending();
  }

  private async publishWebhookEvent(command: ProcessWebhookCommand, normalizedEvent: any): Promise<void> {
    const event: WebhookReceivedEvent = {
      eventId: `webhook_${Date.now()}`,
      eventType: 'WEBHOOK_RECEIVED',
      aggregateId: normalizedEvent.messageId || 'unknown',
      aggregateType: 'Webhook',
      eventData: {
        provider: command.provider,
        messageId: normalizedEvent.messageId,
        status: normalizedEvent.status,
        rawPayload: command.payload
      },
      timestamp: new Date(),
      version: 1
    };

    await this.eventPublisher.publish(event);
  }

  private async publishDeliveredEvent(message: any): Promise<void> {
    const event: MessageDeliveredEvent = {
      eventId: `msg_delivered_${message.id.value}`,
      eventType: 'MESSAGE_DELIVERED',
      aggregateId: message.id.value,
      aggregateType: 'Message',
      eventData: {
        messageId: message.id.value,
        providerMessageId: message.metadata['providerMessageId'] as string,
        deliveredAt: new Date()
      },
      timestamp: new Date(),
      version: 1
    };

    await this.eventPublisher.publish(event);
  }
}