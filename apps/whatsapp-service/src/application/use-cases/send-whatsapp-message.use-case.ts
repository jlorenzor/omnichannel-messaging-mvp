import { Injectable } from '@nestjs/common';
import { ISendMessagePort, SendMessageCommand, SendMessageResult } from '@omnichannel/messaging-ports';
import { IMessagingProviderPort, NormalizedMessage } from '@omnichannel/messaging-ports';
import { Message, MessageContent, ConversationId, ContactId, ChannelType, ProviderType } from '@omnichannel/domain';
import { ProviderSelectionService } from '../services/provider-selection.service';
import { MessageMappingService } from '../services/message-mapping.service';
import { IMessageRepositoryPort } from '@omnichannel/messaging-ports';
import { IEventPublisherPort, MessageSentEvent } from '@omnichannel/messaging-ports';

@Injectable()
export class SendWhatsAppMessageUseCase implements ISendMessagePort {
  constructor(
    private readonly providerSelection: ProviderSelectionService,
    private readonly messageMapping: MessageMappingService,
    private readonly messageRepository: IMessageRepositoryPort,
    private readonly eventPublisher: IEventPublisherPort
  ) {}

  async execute(command: SendMessageCommand): Promise<SendMessageResult> {
    try {
      // 1. Validate command
      this.validateCommand(command);

      // 2. Create domain message
      const message = this.createDomainMessage(command);

      // 3. Select optimal provider
      const provider = await this.providerSelection.selectProvider({
        channelType: command.channelType,
        messageType: command.content.type,
        recipient: command.recipient
      });

      // 4. Map to normalized format
      const normalizedMessage = this.messageMapping.toNormalizedMessage(message);

      // 5. Send via provider
      const response = await provider.sendMessage(normalizedMessage);

      // 6. Update message status
      if (response.success) {
        message.markAsSent(response.providerMessageId);
      } else {
        const error = response.errors?.[0]?.message || 'Unknown error';
        message.markAsFailed(error);
      }

      // 7. Persist message
      await this.messageRepository.save(message);

      // 8. Publish event
      await this.publishMessageEvent(message, provider.constructor.name);

      return {
        messageId: message.id.value,
        status: message.status.value as any,
        providerId: provider.constructor.name,
        estimatedDeliveryTime: response.success ? new Date(Date.now() + 30000) : undefined,
        errors: response.errors?.map(e => e.message)
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  private validateCommand(command: SendMessageCommand): void {
    if (!command.recipient || !command.recipient.trim()) {
      throw new Error('Recipient is required');
    }

    if (!command.content) {
      throw new Error('Message content is required');
    }

    if (command.channelType !== 'whatsapp') {
      throw new Error('This use case only handles WhatsApp messages');
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(command.recipient.replace(/\s/g, ''))) {
      throw new Error('Invalid phone number format');
    }
  }

  private createDomainMessage(command: SendMessageCommand): Message {
    const conversationId = ConversationId.generate(); // In real app, get from context
    const contactId = ContactId.generate(); // In real app, resolve from recipient
    
    const content = this.createMessageContent(command.content);
    const channelType = ChannelType.whatsapp();
    const providerType = ProviderType.gupshup(); // Will be determined by provider selection

    return Message.create(
      conversationId,
      contactId,
      content,
      channelType,
      providerType,
      command.metadata
    );
  }

  private createMessageContent(content: any): MessageContent {
    switch (content.type) {
      case 'text':
        return MessageContent.createText(content.text);
      
      case 'template':
        return MessageContent.createTemplate(
          content.templateId || '',
          content.parameters || {}
        );
      
      default:
        return MessageContent.createText(content.text || 'Empty message');
    }
  }

  private async publishMessageEvent(message: Message, providerId: string): Promise<void> {
    const event: MessageSentEvent = {
      eventId: `msg_sent_${message.id.value}`,
      eventType: 'MESSAGE_SENT',
      aggregateId: message.id.value,
      aggregateType: 'Message',
      eventData: {
        messageId: message.id.value,
        recipient: message.metadata['recipient'] as string,
        provider: providerId,
        channelType: message.channelType.value
      },
      timestamp: new Date(),
      version: 1
    };

    await this.eventPublisher.publish(event);
  }
}