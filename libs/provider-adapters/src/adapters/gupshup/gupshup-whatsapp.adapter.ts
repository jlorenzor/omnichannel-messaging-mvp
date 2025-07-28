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
import { GupshupApiClient } from './gupshup-api-client';
import { GupshupMessageMapper } from './gupshup-message.mapper';
import { GupshupWebhookValidator } from './gupshup-webhook.validator';

export class GupshupWhatsAppAdapter implements IMessagingProviderPort {
  constructor(
    private readonly apiClient: GupshupApiClient,
    private readonly messageMapper: GupshupMessageMapper,
    private readonly webhookValidator: GupshupWebhookValidator
  ) {}

  async sendMessage(message: NormalizedMessage): Promise<ProviderResponse> {
    try {
      const gupshupMessage = this.messageMapper.toGupshupFormat(message);
      const response = await this.apiClient.sendMessage(gupshupMessage);
      return this.mapGupshupResponse(response, message.id);
    } catch (error) {
      return this.handleError(error, message.id);
    }
  }

  async validateWebhook(payload: unknown, signature: string): Promise<boolean> {
    try {
      return await this.webhookValidator.validate(payload, signature);
    } catch (error) {
      console.error('Webhook validation failed:', error);
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
        mediaId: response.mediaId,
        url: response.url,
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined
      };
    } catch (error) {
      throw new Error(`Failed to upload media: ${error}`);
    }
  }

  private mapGupshupResponse(response: any, messageId: string): ProviderResponse {
    return {
      success: response.status === 'submitted',
      providerMessageId: response.messageId || messageId,
      timestamp: new Date(),
      errors: response.status !== 'submitted' ? [this.createError(response)] : undefined,
      retryAfter: response.retryAfter ? parseInt(response.retryAfter) : undefined,
      quotaRemaining: response.quotaRemaining ? parseInt(response.quotaRemaining) : undefined
    };
  }

  private createError(response: any): ProviderError {
    return {
      code: response.code || 'UNKNOWN_ERROR',
      message: response.message || 'Unknown error occurred',
      type: this.mapErrorType(response.code),
      retryable: this.isRetryableError(response.code)
    };
  }

  private mapErrorType(code: string): ErrorType {
    const errorTypeMap: Record<string, ErrorType> = {
      'INVALID_PHONE_NUMBER': ErrorType.VALIDATION,
      'INVALID_MESSAGE': ErrorType.VALIDATION,
      'AUTHENTICATION_FAILED': ErrorType.AUTHENTICATION,
      'RATE_LIMIT_EXCEEDED': ErrorType.RATE_LIMIT,
      'QUOTA_EXCEEDED': ErrorType.QUOTA_EXCEEDED,
      'NETWORK_ERROR': ErrorType.NETWORK,
      'PROVIDER_ERROR': ErrorType.PROVIDER_ERROR
    };

    return errorTypeMap[code] || ErrorType.UNKNOWN;
  }

  private isRetryableError(code: string): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'PROVIDER_ERROR',
      'TIMEOUT'
    ];
    return retryableCodes.includes(code);
  }

  private handleError(error: any, messageId: string): ProviderResponse {
    console.error('Gupshup adapter error:', error);

    return {
      success: false,
      providerMessageId: messageId,
      timestamp: new Date(),
      errors: [{
        code: error.code || 'ADAPTER_ERROR',
        message: error.message || 'Adapter error occurred',
        type: ErrorType.PROVIDER_ERROR,
        retryable: true
      }]
    };
  }
}