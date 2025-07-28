import { IMessagingProviderPort } from '@omnichannel/messaging-ports';
import { GupshupWhatsAppAdapter, GupshupApiClient, GupshupMessageMapper, GupshupWebhookValidator } from '../adapters/gupshup';
import { MetaWhatsAppAdapter, MetaApiClient, MetaMessageMapper, MetaWebhookValidator } from '../adapters/meta';

export interface ProviderConfig {
  gupshup: {
    apiUrl: string;
    appName: string;
    apiKey: string;
    sourcePhoneNumber: string;
    webhookSecret: string;
    timeout: number;
  };
  meta: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    graphApiUrl: string;
    apiVersion: string;
    webhookVerifyToken: string;
    appSecret: string;
    timeout: number;
  };
}

export class ProviderFactory {
  static createGupshupAdapter(config: ProviderConfig['gupshup']): IMessagingProviderPort {
    const apiClient = new GupshupApiClient({
      apiUrl: config.apiUrl,
      appName: config.appName,
      apiKey: config.apiKey,
      timeout: config.timeout
    });

    const messageMapper = new GupshupMessageMapper(config.sourcePhoneNumber);
    
    const webhookValidator = new GupshupWebhookValidator({
      webhookSecret: config.webhookSecret
    });

    return new GupshupWhatsAppAdapter(apiClient, messageMapper, webhookValidator);
  }

  static createMetaAdapter(config: ProviderConfig['meta']): IMessagingProviderPort {
    const apiClient = new MetaApiClient({
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      graphApiUrl: config.graphApiUrl,
      apiVersion: config.apiVersion,
      timeout: config.timeout
    });

    const messageMapper = new MetaMessageMapper();
    
    const webhookValidator = new MetaWebhookValidator({
      webhookVerifyToken: config.webhookVerifyToken,
      appSecret: config.appSecret
    });

    return new MetaWhatsAppAdapter(apiClient, messageMapper, webhookValidator);
  }

  static createProvider(providerType: string, config: any): IMessagingProviderPort {
    switch (providerType.toLowerCase()) {
      case 'gupshup':
        return this.createGupshupAdapter(config);
      
      case 'meta':
        return this.createMetaAdapter(config);
      
      default:
        throw new Error(`Unsupported provider type: ${providerType}`);
    }
  }

  static getAvailableProviders(): string[] {
    return ['gupshup', 'meta'];
  }

  static supportsProvider(providerType: string): boolean {
    return this.getAvailableProviders().includes(providerType.toLowerCase());
  }
}