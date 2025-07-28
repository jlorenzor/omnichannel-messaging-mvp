import { Injectable } from '@nestjs/common';
import { GupshupWebhookValidator } from '@omnichannel/provider-adapters';
import { MetaWebhookValidator } from '@omnichannel/provider-adapters';

@Injectable()
export class WebhookMappingService {
  normalizeEvent(provider: string, payload: any): any {
    switch (provider.toLowerCase()) {
      case 'gupshup':
        return this.normalizeGupshupEvent(payload);
      
      case 'meta':
        return this.normalizeMetaEvent(payload);
      
      default:
        throw new Error(`Unsupported provider for webhook mapping: ${provider}`);
    }
  }

  private normalizeGupshupEvent(payload: any): any {
    // Use the Gupshup validator's normalization method
    const validator = new GupshupWebhookValidator({ webhookSecret: 'dummy' });
    return validator.normalizeWebhookEvent(payload);
  }

  private normalizeMetaEvent(payload: any): any {
    // Use the Meta validator's normalization method
    const validator = new MetaWebhookValidator({ 
      webhookVerifyToken: 'dummy', 
      appSecret: 'dummy' 
    });
    return validator.normalizeWebhookEvent(payload);
  }

  getWebhookEventType(provider: string, payload: any): string {
    const normalized = this.normalizeEvent(provider, payload);
    return normalized.eventType || 'unknown';
  }

  extractMessageId(provider: string, payload: any): string | undefined {
    const normalized = this.normalizeEvent(provider, payload);
    return normalized.messageId;
  }

  extractStatus(provider: string, payload: any): string | undefined {
    const normalized = this.normalizeEvent(provider, payload);
    return normalized.status;
  }
}