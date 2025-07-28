export interface IEventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly eventData: Record<string, unknown>;
  readonly timestamp: Date;
  readonly version: number;
}

export interface MessageSentEvent extends DomainEvent {
  readonly eventType: 'MESSAGE_SENT';
  readonly eventData: {
    messageId: string;
    recipient: string;
    provider: string;
    channelType: string;
  };
}

export interface MessageDeliveredEvent extends DomainEvent {
  readonly eventType: 'MESSAGE_DELIVERED';
  readonly eventData: {
    messageId: string;
    providerMessageId: string;
    deliveredAt: Date;
  };
}

export interface MessageFailedEvent extends DomainEvent {
  readonly eventType: 'MESSAGE_FAILED';
  readonly eventData: {
    messageId: string;
    error: string;
    retryCount: number;
    provider: string;
  };
}

export interface WebhookReceivedEvent extends DomainEvent {
  readonly eventType: 'WEBHOOK_RECEIVED';
  readonly eventData: {
    provider: string;
    messageId?: string;
    status?: string;
    rawPayload: unknown;
  };
}