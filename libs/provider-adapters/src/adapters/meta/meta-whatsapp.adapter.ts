import { IMessagingProviderPort } from '@omnichannel/messaging-ports';
import {
  NormalizedMessage,
  ProviderResponse,
  DeliveryStatus,
  Template,
  MediaUpload,
  MediaUploadResponse,
  ProviderError,
  ErrorType
} from '@omnichannel/messaging-ports';
import { MetaApiClient } from './meta-api-client';
import { MetaMessageMapper } from './meta-message.mapper';
import { MetaWebhookValidator } from './meta-webhook.validator';

export class MetaWhatsAppAdapter implements IMessagingProviderPort {
  constructor(
    private readonly apiClient: MetaApiClient,
    private readonly messageMapper: MetaMessageMapper,
    private readonly webhookValidator: MetaWebhookValidator
  ) {}

  async sendMessage(message: NormalizedMessage): Promise<ProviderResponse> {
    try {
      const metaMessage = this.messageMapper.toMetaFormat(message);
      const response = await this.apiClient.sendMessage(metaMessage);
      return this.mapMetaResponse(response, message.id);
    } catch (error) {
      return this.handleError(error, message.id);
    }
  }

  async validateWebhook(payload: unknown, signature: string): Promise<boolean> {
    try {
      return await this.webhookValidator.validate(payload, signature);
    } catch (error) {
      console.error('Meta webhook validation failed:', error);
      return false;
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      const status = await this.apiClient.getMessageStatus(messageId);
      return this.messageMapper.toDeliveryStatus(status);
    } catch (error) {
      throw new Error(`Failed to get delivery status for message ${messageId}: ${error}`);
    }
  }

  async getTemplates(): Promise<Template[]> {
    try {
      const templates = await this.apiClient.getTemplates();
      return templates.map(template => this.messageMapper.toTemplate(template));
    } catch (error) {
      throw new Error(`Failed to fetch templates: ${error}`);
    }
  }

  async uploadMedia(media: MediaUpload): Promise<MediaUploadResponse> {
    try {
      const response = await this.apiClient.uploadMedia(media);
      return {
        mediaId: response.id,
        url: response.url || '',
        expiresAt: undefined // Meta doesn't provide expiration
      };
    } catch (error) {
      throw new Error(`Failed to upload media: ${error}`);
    }
  }

  private mapMetaResponse(response: any, messageId: string): ProviderResponse {
    if (response.messages && response.messages[0]) {
      return {
        success: true,
        providerMessageId: response.messages[0].id,
        timestamp: new Date(),
        errors: undefined,
        retryAfter: undefined,
        quotaRemaining: undefined
      };
    }

    return {
      success: false,
      providerMessageId: messageId,
      timestamp: new Date(),
      errors: response.error ? [this.createError(response.error)] : undefined
    };
  }

  private createError(error: any): ProviderError {
    return {
      code: error.code?.toString() || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      type: this.mapErrorType(error.code),
      retryable: this.isRetryableError(error.code)
    };
  }

  private mapErrorType(code: number): ErrorType {
    const errorTypeMap: Record<number, ErrorType> = {
      100: ErrorType.VALIDATION, // Invalid parameter
      190: ErrorType.AUTHENTICATION, // Access token invalid
      200: ErrorType.AUTHENTICATION, // Missing permissions
      4: ErrorType.RATE_LIMIT, // Rate limit exceeded
      17: ErrorType.RATE_LIMIT, // User request limit reached
      613: ErrorType.RATE_LIMIT, // Calls to this API have exceeded the rate limit
      80007: ErrorType.QUOTA_EXCEEDED, // Message quota exceeded
      1: ErrorType.UNKNOWN // Unknown error
    };

    return errorTypeMap[code] || ErrorType.UNKNOWN;
  }

  private isRetryableError(code: number): boolean {
    const retryableCodes = [
      1, // Temporary issue
      2, // Temporary API unavailability
      4, // Rate limit exceeded
      17, // User request limit reached
      613 // API rate limit
    ];
    return retryableCodes.includes(code);
  }

  private handleError(error: any, messageId: string): ProviderResponse {
    console.error('Meta adapter error:', error);

    return {
      success: false,
      providerMessageId: messageId,
      timestamp: new Date(),
      errors: [{
        code: error.code?.toString() || 'ADAPTER_ERROR',
        message: error.message || 'Adapter error occurred',
        type: ErrorType.PROVIDER_ERROR,
        retryable: true
      }]
    };
  }
}