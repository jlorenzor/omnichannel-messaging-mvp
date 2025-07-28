import {
  NormalizedMessage,
  DeliveryStatus,
  Template,
  MessageStatus,
  TemplateStatus,
  TemplateCategory,
  ComponentType
} from '@omnichannel/messaging-ports';
import { 
  GupshupMessageRequest, 
  GupshupStatusResponse, 
  GupshupTemplate 
} from './gupshup-api-client';

export class GupshupMessageMapper {
  constructor(private readonly sourcePhoneNumber: string) {}

  toGupshupFormat(message: NormalizedMessage): GupshupMessageRequest {
    const gupshupMessage: GupshupMessageRequest = {
      source: this.sourcePhoneNumber,
      destination: this.normalizePhoneNumber(message.recipient),
      message: this.mapMessageContent(message),
      'src.name': 'WhatsApp Business'
    };

    return gupshupMessage;
  }

  toDeliveryStatus(response: GupshupStatusResponse): DeliveryStatus {
    return {
      messageId: response.messageId,
      providerMessageId: response.messageId,
      status: this.mapStatusToMessageStatus(response.status),
      timestamp: new Date(response.timestamp),
      errors: response.status === 'failed' ? ['Message delivery failed'] : undefined
    };
  }

  toTemplate(gupshupTemplate: GupshupTemplate): Template {
    return {
      id: gupshupTemplate.id,
      name: gupshupTemplate.elementName,
      language: gupshupTemplate.language,
      status: this.mapTemplateStatus(gupshupTemplate.status),
      category: this.mapTemplateCategory(gupshupTemplate.category),
      components: gupshupTemplate.components.map(component => ({
        type: this.mapComponentType(component.type),
        text: component.text,
        parameters: []
      }))
    };
  }

  private mapMessageContent(message: NormalizedMessage): any {
    switch (message.type) {
      case 'text':
        return {
          type: 'text',
          text: message.content.text
        };

      case 'template':
        return {
          type: 'template',
          template: {
            name: message.content.templateId,
            language: { code: 'en' },
            components: this.buildTemplateComponents(message.content.parameters || {})
          }
        };

      case 'image':
        const imageAttachment = message.attachments?.[0];
        return {
          type: 'image',
          originalUrl: imageAttachment?.url,
          previewUrl: imageAttachment?.url,
          caption: message.content.text || imageAttachment?.caption
        };

      case 'document':
        const docAttachment = message.attachments?.[0];
        return {
          type: 'file',
          originalUrl: docAttachment?.url,
          filename: docAttachment?.filename || 'document',
          caption: message.content.text
        };

      case 'audio':
        const audioAttachment = message.attachments?.[0];
        return {
          type: 'audio',
          originalUrl: audioAttachment?.url
        };

      case 'video':
        const videoAttachment = message.attachments?.[0];
        return {
          type: 'video',
          originalUrl: videoAttachment?.url,
          caption: message.content.text
        };

      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private buildTemplateComponents(parameters: Record<string, string>): any[] {
    const components = [];

    if (Object.keys(parameters).length > 0) {
      components.push({
        type: 'body',
        parameters: Object.values(parameters).map(value => ({
          type: 'text',
          text: value
        }))
      });
    }

    return components;
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }

  private mapStatusToMessageStatus(status: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      'enroute': MessageStatus.SENT,
      'delivered': MessageStatus.DELIVERED,
      'read': MessageStatus.READ,
      'failed': MessageStatus.FAILED,
      'sent': MessageStatus.SENT
    };

    return statusMap[status.toLowerCase()] || MessageStatus.PENDING;
  }

  private mapTemplateStatus(status: string): TemplateStatus {
    const statusMap: Record<string, TemplateStatus> = {
      'approved': TemplateStatus.APPROVED,
      'pending': TemplateStatus.PENDING,
      'rejected': TemplateStatus.REJECTED,
      'disabled': TemplateStatus.DISABLED
    };

    return statusMap[status.toLowerCase()] || TemplateStatus.PENDING;
  }

  private mapTemplateCategory(category: string): TemplateCategory {
    const categoryMap: Record<string, TemplateCategory> = {
      'marketing': TemplateCategory.MARKETING,
      'utility': TemplateCategory.UTILITY,
      'authentication': TemplateCategory.AUTHENTICATION
    };

    return categoryMap[category.toLowerCase()] || TemplateCategory.UTILITY;
  }

  private mapComponentType(type: string): ComponentType {
    const typeMap: Record<string, ComponentType> = {
      'header': ComponentType.HEADER,
      'body': ComponentType.BODY,
      'footer': ComponentType.FOOTER,
      'buttons': ComponentType.BUTTONS
    };

    return typeMap[type.toLowerCase()] || ComponentType.BODY;
  }
}