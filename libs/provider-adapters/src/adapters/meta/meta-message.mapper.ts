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
  MetaMessageRequest, 
  MetaStatusResponse, 
  MetaTemplate 
} from './meta-api-client';

export class MetaMessageMapper {
  constructor() {}

  toMetaFormat(message: NormalizedMessage): MetaMessageRequest {
    const baseMessage: MetaMessageRequest = {
      messaging_product: 'whatsapp',
      to: this.normalizePhoneNumber(message.recipient),
      type: this.mapMessageType(message.type)
    };

    return {
      ...baseMessage,
      ...this.mapMessageContent(message)
    };
  }

  toDeliveryStatus(response: MetaStatusResponse): DeliveryStatus {
    return {
      messageId: response.id,
      providerMessageId: response.id,
      status: this.mapStatusToMessageStatus(response.status),
      timestamp: new Date(parseInt(response.timestamp) * 1000),
      errors: response.error ? [`${response.error.title}: ${response.error.message}`] : undefined
    };
  }

  toTemplate(metaTemplate: MetaTemplate): Template {
    return {
      id: metaTemplate.id,
      name: metaTemplate.name,
      language: metaTemplate.language,
      status: this.mapTemplateStatus(metaTemplate.status),
      category: this.mapTemplateCategory(metaTemplate.category),
      components: metaTemplate.components.map(component => ({
        type: this.mapComponentType(component.type),
        text: component.text,
        parameters: []
      }))
    };
  }

  private mapMessageType(type: string): string {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'template': 'template',
      'image': 'image',
      'document': 'document',
      'audio': 'audio',
      'video': 'video',
      'interactive': 'interactive'
    };

    return typeMap[type] || 'text';
  }

  private mapMessageContent(message: NormalizedMessage): Partial<MetaMessageRequest> {
    switch (message.type) {
      case 'text':
        return {
          text: {
            body: message.content.text || ''
          }
        };

      case 'template':
        return {
          template: {
            name: message.content.templateId || '',
            language: {
              code: 'en_US'
            },
            components: this.buildTemplateComponents(message.content.parameters || {})
          }
        };

      case 'image':
        const imageAttachment = message.attachments?.[0];
        return {
          image: {
            link: imageAttachment?.url,
            caption: message.content.text || imageAttachment?.caption
          }
        };

      case 'document':
        const docAttachment = message.attachments?.[0];
        return {
          document: {
            link: docAttachment?.url,
            caption: message.content.text,
            filename: docAttachment?.filename || 'document'
          }
        };

      case 'audio':
        const audioAttachment = message.attachments?.[0];
        return {
          audio: {
            link: audioAttachment?.url
          }
        };

      case 'video':
        const videoAttachment = message.attachments?.[0];
        return {
          video: {
            link: videoAttachment?.url,
            caption: message.content.text
          }
        };

      default:
        return {
          text: {
            body: 'Unsupported message type'
          }
        };
    }
  }

  private buildTemplateComponents(parameters: Record<string, string>): any[] {
    const components = [];
    const parameterValues = Object.values(parameters);

    if (parameterValues.length > 0) {
      components.push({
        type: 'body',
        parameters: parameterValues.map(value => ({
          type: 'text',
          text: value
        }))
      });
    }

    return components;
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters except +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove + for Meta API (they expect numbers without +)
    if (normalized.startsWith('+')) {
      normalized = normalized.substring(1);
    }

    return normalized;
  }

  private mapStatusToMessageStatus(status: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      'sent': MessageStatus.SENT,
      'delivered': MessageStatus.DELIVERED,
      'read': MessageStatus.READ,
      'failed': MessageStatus.FAILED,
      'accepted': MessageStatus.SENT
    };

    return statusMap[status.toLowerCase()] || MessageStatus.PENDING;
  }

  private mapTemplateStatus(status: string): TemplateStatus {
    const statusMap: Record<string, TemplateStatus> = {
      'approved': TemplateStatus.APPROVED,
      'pending': TemplateStatus.PENDING,
      'rejected': TemplateStatus.REJECTED,
      'disabled': TemplateStatus.DISABLED,
      'paused': TemplateStatus.DISABLED
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