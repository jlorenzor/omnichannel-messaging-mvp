import { createHmac } from 'crypto';

export interface MetaWebhookConfig {
  webhookVerifyToken: string;
  appSecret: string;
}

export class MetaWebhookValidator {
  constructor(private readonly config: MetaWebhookConfig) {}

  async validate(payload: unknown, signature: string): Promise<boolean> {
    try {
      if (!signature) {
        console.warn('No signature provided for Meta webhook validation');
        return false;
      }

      const payloadString = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);

      // Meta signature format: sha256=<signature>
      const expectedSignature = 'sha256=' + this.generateSignature(payloadString);
      
      return this.safeCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Error validating Meta webhook signature:', error);
      return false;
    }
  }

  validateVerifyToken(token: string): boolean {
    return token === this.config.webhookVerifyToken;
  }

  normalizeWebhookEvent(payload: any): {
    messageId?: string;
    status?: string;
    timestamp: string;
    eventType: string;
    phoneNumber?: string;
    error?: string;
    conversationId?: string;
    businessAccountId?: string;
  } {
    // Meta webhook structure is more complex
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const status = value?.statuses?.[0];
    
    if (message) {
      // Incoming message
      return {
        messageId: message.id,
        eventType: 'message_received',
        timestamp: new Date().toISOString(),
        phoneNumber: message.from,
        businessAccountId: entry?.id
      };
    } else if (status) {
      // Status update
      return {
        messageId: status.id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
        eventType: 'message_status',
        phoneNumber: status.recipient_id,
        conversationId: status.conversation?.id,
        error: status.error ? `${status.error.title}: ${status.error.message}` : undefined,
        businessAccountId: entry?.id
      };
    }

    // Fallback
    return {
      eventType: 'unknown',
      timestamp: new Date().toISOString(),
      businessAccountId: entry?.id
    };
  }

  private generateSignature(payload: string): string {
    return createHmac('sha256', this.config.appSecret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  private safeCompare(signature1: string, signature2: string): boolean {
    if (signature1.length !== signature2.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature1.length; i++) {
      result |= signature1.charCodeAt(i) ^ signature2.charCodeAt(i);
    }

    return result === 0;
  }
}