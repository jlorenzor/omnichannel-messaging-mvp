import { Injectable } from '@nestjs/common';
import { IMessagingProviderPort } from '@omnichannel/messaging-ports';
import { ProviderFactory } from '@omnichannel/provider-adapters';
import { ConfigService } from '@nestjs/config';

export interface ProviderSelectionCriteria {
  channelType: string;
  messageType: string;
  recipient: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ProviderHealth {
  providerId: string;
  isHealthy: boolean;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
}

@Injectable()
export class ProviderSelectionService {
  private providers: Map<string, IMessagingProviderPort> = new Map();
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private selectionStrategy: 'round_robin' | 'weighted' | 'failover' = 'failover';
  private currentRoundRobinIndex = 0;

  constructor(private readonly configService: ConfigService) {
    this.initializeProviders();
    this.startHealthChecking();
  }

  async selectProvider(criteria: ProviderSelectionCriteria): Promise<IMessagingProviderPort> {
    const availableProviders = this.getHealthyProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    switch (this.selectionStrategy) {
      case 'round_robin':
        return this.selectRoundRobin(availableProviders);
      
      case 'weighted':
        return this.selectWeighted(availableProviders, criteria);
      
      case 'failover':
      default:
        return this.selectFailover(availableProviders, criteria);
    }
  }

  getProviderByType(providerType: string): IMessagingProviderPort {
    const provider = this.providers.get(providerType.toLowerCase());
    if (!provider) {
      throw new Error(`Provider not found: ${providerType}`);
    }
    return provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderHealth(providerId: string): ProviderHealth | undefined {
    return this.providerHealth.get(providerId);
  }

  getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealth.values());
  }

  private initializeProviders(): void {
    try {
      // Initialize Gupshup provider
      const gupshupConfig = {
        apiUrl: this.configService.get('GUPSHUP_API_URL', 'https://api.gupshup.io'),
        appName: this.configService.get('GUPSHUP_APP_NAME'),
        apiKey: this.configService.get('GUPSHUP_API_KEY'),
        sourcePhoneNumber: this.configService.get('GUPSHUP_SOURCE_PHONE'),
        webhookSecret: this.configService.get('GUPSHUP_WEBHOOK_SECRET'),
        timeout: parseInt(this.configService.get('GUPSHUP_TIMEOUT', '10000'))
      };

      if (gupshupConfig.apiKey && gupshupConfig.appName) {
        const gupshupProvider = ProviderFactory.createGupshupAdapter(gupshupConfig);
        this.providers.set('gupshup', gupshupProvider);
        this.initializeProviderHealth('gupshup');
        console.log('Gupshup provider initialized');
      }

      // Initialize Meta provider
      const metaConfig = {
        accessToken: this.configService.get('META_ACCESS_TOKEN'),
        phoneNumberId: this.configService.get('META_PHONE_NUMBER_ID'),
        businessAccountId: this.configService.get('META_BUSINESS_ACCOUNT_ID'),
        graphApiUrl: this.configService.get('META_GRAPH_API_URL', 'https://graph.facebook.com'),
        apiVersion: this.configService.get('META_API_VERSION', 'v18.0'),
        webhookVerifyToken: this.configService.get('META_WEBHOOK_VERIFY_TOKEN'),
        appSecret: this.configService.get('META_APP_SECRET'),
        timeout: parseInt(this.configService.get('META_TIMEOUT', '10000'))
      };

      if (metaConfig.accessToken && metaConfig.phoneNumberId) {
        const metaProvider = ProviderFactory.createMetaAdapter(metaConfig);
        this.providers.set('meta', metaProvider);
        this.initializeProviderHealth('meta');
        console.log('Meta provider initialized');
      }

      console.log(`Initialized ${this.providers.size} messaging providers`);
    } catch (error) {
      console.error('Error initializing providers:', error);
    }
  }

  private initializeProviderHealth(providerId: string): void {
    this.providerHealth.set(providerId, {
      providerId,
      isHealthy: true,
      responseTime: 0,
      errorRate: 0,
      lastChecked: new Date()
    });
  }

  private getHealthyProviders(): Array<{ id: string; provider: IMessagingProviderPort }> {
    const healthy = [];
    
    for (const [id, provider] of this.providers.entries()) {
      const health = this.providerHealth.get(id);
      if (health?.isHealthy) {
        healthy.push({ id, provider });
      }
    }
    
    return healthy;
  }

  private selectRoundRobin(providers: Array<{ id: string; provider: IMessagingProviderPort }>): IMessagingProviderPort {
    const selected = providers[this.currentRoundRobinIndex % providers.length];
    this.currentRoundRobinIndex++;
    return selected.provider;
  }

  private selectWeighted(providers: Array<{ id: string; provider: IMessagingProviderPort }>, criteria: ProviderSelectionCriteria): IMessagingProviderPort {
    // Weight based on response time and error rate
    const weights = providers.map(p => {
      const health = this.providerHealth.get(p.id)!;
      const responseTimeWeight = 1000 / (health.responseTime + 100); // Lower response time = higher weight
      const errorRateWeight = 1 / (health.errorRate + 0.01); // Lower error rate = higher weight
      return { ...p, weight: responseTimeWeight * errorRateWeight };
    });

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const weighted of weights) {
      currentWeight += weighted.weight;
      if (random <= currentWeight) {
        return weighted.provider;
      }
    }

    return providers[0].provider; // Fallback
  }

  private selectFailover(providers: Array<{ id: string; provider: IMessagingProviderPort }>, criteria: ProviderSelectionCriteria): IMessagingProviderPort {
    // Primary: Meta (generally more reliable)
    // Fallback: Gupshup
    
    const preferredOrder = ['meta', 'gupshup'];
    
    for (const preferredId of preferredOrder) {
      const provider = providers.find(p => p.id === preferredId);
      if (provider) {
        return provider.provider;
      }
    }

    // If no preferred provider is available, return the first healthy one
    return providers[0].provider;
  }

  private startHealthChecking(): void {
    // Check provider health every 30 seconds
    setInterval(async () => {
      await this.checkProvidersHealth();
    }, 30000);

    // Initial health check
    setTimeout(() => this.checkProvidersHealth(), 5000);
  }

  private async checkProvidersHealth(): Promise<void> {
    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const startTime = Date.now();
        
        // Simple health check - try to get templates (lightweight operation)
        await provider.getTemplates();
        
        const responseTime = Date.now() - startTime;
        
        // Update health status
        const currentHealth = this.providerHealth.get(providerId);
        if (currentHealth) {
          this.providerHealth.set(providerId, {
            ...currentHealth,
            isHealthy: true,
            responseTime,
            lastChecked: new Date(),
            errorRate: Math.max(0, currentHealth.errorRate - 0.01) // Slowly recover error rate
          });
        }
      } catch (error) {
        console.warn(`Health check failed for provider ${providerId}:`, error.message);
        
        const currentHealth = this.providerHealth.get(providerId);
        if (currentHealth) {
          const newErrorRate = Math.min(1, currentHealth.errorRate + 0.1);
          this.providerHealth.set(providerId, {
            ...currentHealth,
            isHealthy: newErrorRate < 0.5, // Mark as unhealthy if error rate > 50%
            errorRate: newErrorRate,
            lastChecked: new Date()
          });
        }
      }
    }
  }
}