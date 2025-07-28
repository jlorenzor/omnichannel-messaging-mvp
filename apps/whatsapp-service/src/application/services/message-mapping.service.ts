import { Injectable } from '@nestjs/common';
import { NormalizedMessage, MessageMetadata, MessagePriority } from '@omnichannel/messaging-ports';
import { Message } from '@omnichannel/domain';

@Injectable()
export class MessageMappingService {
  toNormalizedMessage(message: Message): NormalizedMessage {
    return {
      id: message.id.value,
      recipient: this.extractRecipient(message),
      content: this.mapContent(message),
      type: this.mapContentType(message),
      metadata: this.createMetadata(message),
      attachments: this.mapAttachments(message)
    };
  }

  private extractRecipient(message: Message): string {
    // In a real implementation, this would be extracted from the contact or conversation
    return message.metadata['recipient'] as string || 'unknown';
  }

  private mapContent(message: Message): any {
    const content = message.content;
    
    return {
      text: content.text,
      templateId: content.templateId,
      parameters: content.parameters
    };
  }

  private mapContentType(message: Message): string {
    return message.content.type;
  }

  private createMetadata(message: Message): MessageMetadata {
    return {
      conversationId: message.conversationId.value,
      contactId: message.contactId.value,
      timestamp: message.createdAt,
      priority: this.mapPriority(message),
      retryCount: (message.metadata['retryCount'] as number) || 0,
      source: 'whatsapp-service'
    };
  }

  private mapPriority(message: Message): MessagePriority {
    const priority = message.metadata['priority'] as string;
    
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return MessagePriority.URGENT;
      case 'high':
        return MessagePriority.HIGH;
      case 'low':
        return MessagePriority.LOW;
      default:
        return MessagePriority.NORMAL;
    }
  }

  private mapAttachments(message: Message): any[] | undefined {
    const attachments = message.content.mediaAttachments;
    
    if (!attachments || attachments.length === 0) {
      return undefined;
    }

    return attachments.map(attachment => ({
      id: attachment.id,
      type: attachment.type,
      url: attachment.url,
      filename: attachment.filename,
      caption: attachment.caption,
      size: attachment.size
    }));
  }
}