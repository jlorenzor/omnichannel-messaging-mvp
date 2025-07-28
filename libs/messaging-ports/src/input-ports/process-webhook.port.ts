export interface IProcessWebhookPort {
  execute(command: ProcessWebhookCommand): Promise<ProcessWebhookResult>;
}

export interface ProcessWebhookCommand {
  readonly provider: ProviderType;
  readonly payload: unknown;
  readonly signature: string;
  readonly headers: Record<string, string>;
  readonly timestamp: Date;
}

export interface ProcessWebhookResult {
  readonly eventType: WebhookEventType;
  readonly messageId?: string;
  readonly processed: boolean;
  readonly errors?: string[];
  readonly normalizedEvent?: NormalizedWebhookEvent;
}

export interface NormalizedWebhookEvent {
  readonly messageId: string;
  readonly status: string;
  readonly timestamp: Date;
  readonly provider: ProviderType;
  readonly phoneNumber?: string;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

export enum ProviderType {
  GUPSHUP = 'gupshup',
  META = 'meta',
  TWILIO = 'twilio',
  SENDGRID = 'sendgrid',
  AWS_SNS = 'aws_sns',
  AWS_SES = 'aws_ses'
}

export enum WebhookEventType {
  MESSAGE_STATUS = 'message_status',
  MESSAGE_RECEIVED = 'message_received',
  DELIVERY_RECEIPT = 'delivery_receipt',
  READ_RECEIPT = 'read_receipt',
  USER_EVENT = 'user_event',
  SYSTEM_EVENT = 'system_event',
  ERROR_EVENT = 'error_event'
}