import { IMessagingProviderPort } from '@omnichannel/messaging-ports';
import { GupshupWhatsAppAdapter, GupshupApiClient, GupshupMessageMapper, GupshupWebhookValidator } from '../adapters/gupshup';

export interface ProviderConfig {
  gupshup: {
    apiUrl: string;
    appName: string;
    apiKey: string;
    sourcePhoneNumber: string;
    webhookSecret: string;
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

  static createProvider(providerType: string, config: any): IMessagingProviderPort {
    switch (providerType.toLowerCase()) {
      case 'gupshup':
        return this.createGupshupAdapter(config);
      
      default:
        throw new Error(`Unsupported provider type: ${providerType}`);
    }
  }
}