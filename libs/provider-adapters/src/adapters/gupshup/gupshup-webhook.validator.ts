import { createHmac } from 'crypto';

export interface GupshupWebhookConfig {
  webhookSecret: string;
}

export class GupshupWebhookValidator {
  constructor(private readonly config: GupshupWebhookConfig) {}

  async validate(payload: unknown, signature: string): Promise<boolean> {
    try {
      if (!signature) {
        console.warn('No signature provided for Gupshup webhook validation');
        return false;
      }

      const payloadString = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);

      const expectedSignature = this.generateSignature(payloadString);
      
      return this.safeCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Error validating Gupshup webhook signature:', error);
      return false;
    }
  }

  normalizeWebhookEvent(payload: any): {
    messageId: string;
    status: string;
    timestamp: string;
    eventType: string;
    phoneNumber?: string;
    error?: string;
  } {
    return {
      messageId: payload.messageId || payload.id,
      status: payload.type || payload.status,
      timestamp: payload.timestamp || new Date().toISOString(),
      eventType: payload.type || 'message',
      phoneNumber: payload.mobile || payload.phone,
      error: payload.error
    };
  }

  private generateSignature(payload: string): string {
    return createHmac('sha256', this.config.webhookSecret)
      .update(payload)
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