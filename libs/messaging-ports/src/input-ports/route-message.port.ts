export interface IRouteMessagePort {
  execute(command: RouteMessageCommand): Promise<RouteMessageResult>;
}

export interface RouteMessageCommand {
  readonly messageId: string;
  readonly channelType: string;
  readonly recipient: string;
  readonly messageType: string;
  readonly priority: MessagePriority;
  readonly constraints?: RoutingConstraints;
}

export interface RouteMessageResult {
  readonly selectedProvider: string;
  readonly routingDecision: RoutingDecision;
  readonly fallbackProviders: string[];
  readonly estimatedCost?: number;
  readonly estimatedDeliveryTime?: Date;
}

export interface RoutingDecision {
  readonly providerId: string;
  readonly reason: string;
  readonly confidence: number;
  readonly alternatives: ProviderOption[];
}

export interface ProviderOption {
  readonly providerId: string;
  readonly score: number;
  readonly reasons: string[];
  readonly available: boolean;
  readonly cost?: number;
}

export interface RoutingConstraints {
  readonly excludedProviders?: string[];
  readonly preferredProviders?: string[];
  readonly maxCost?: number;
  readonly maxDeliveryTime?: number;
  readonly requiresFeatures?: string[];
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}