export interface IMessagingProviderPort {
  sendMessage(message: NormalizedMessage): Promise<ProviderResponse>;
  validateWebhook(payload: unknown, signature: string): Promise<boolean>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  getTemplates(): Promise<Template[]>;
  uploadMedia(media: MediaUpload): Promise<MediaUploadResponse>;
}

export interface NormalizedMessage {
  readonly id: string;
  readonly recipient: string;
  readonly content: MessageContent;
  readonly type: MessageContentType;
  readonly metadata: MessageMetadata;
  readonly attachments?: MediaAttachment[];
}

export interface MessageContent {
  readonly text?: string;
  readonly templateId?: string;
  readonly parameters?: Record<string, string>;
}

export interface MessageMetadata {
  readonly conversationId?: string;
  readonly contactId?: string;
  readonly timestamp: Date;
  readonly priority: MessagePriority;
  readonly retryCount: number;
  readonly source: string;
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MessageContentType {
  TEXT = 'text',
  TEMPLATE = 'template',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  INTERACTIVE = 'interactive'
}

export interface MediaAttachment {
  readonly id: string;
  readonly type: MediaType;
  readonly url: string;
  readonly filename?: string;
  readonly caption?: string;
  readonly size?: number;
}

export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video'
}

export interface ProviderResponse {
  readonly success: boolean;
  readonly providerMessageId: string;
  readonly timestamp: Date;
  readonly errors?: ProviderError[];
  readonly retryAfter?: number;
  readonly quotaRemaining?: number;
}

export interface ProviderError {
  readonly code: string;
  readonly message: string;
  readonly type: ErrorType;
  readonly retryable: boolean;
}

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK = 'network',
  PROVIDER_ERROR = 'provider_error',
  UNKNOWN = 'unknown'
}

export interface DeliveryStatus {
  readonly messageId: string;
  readonly providerMessageId: string;
  readonly status: MessageStatus;
  readonly timestamp: Date;
  readonly errors?: string[];
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  REJECTED = 'rejected'
}

export interface Template {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly status: TemplateStatus;
  readonly category: TemplateCategory;
  readonly components: TemplateComponent[];
}

export enum TemplateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISABLED = 'disabled'
}

export enum TemplateCategory {
  MARKETING = 'marketing',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication'
}

export interface TemplateComponent {
  readonly type: ComponentType;
  readonly text?: string;
  readonly parameters?: TemplateParameter[];
}

export enum ComponentType {
  HEADER = 'header',
  BODY = 'body',
  FOOTER = 'footer',
  BUTTONS = 'buttons'
}

export interface TemplateParameter {
  readonly type: ParameterType;
  readonly text?: string;
}

export enum ParameterType {
  TEXT = 'text',
  CURRENCY = 'currency',
  DATE_TIME = 'date_time',
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video'
}

export interface MediaUpload {
  readonly file: Buffer;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface MediaUploadResponse {
  readonly mediaId: string;
  readonly url: string;
  readonly expiresAt?: Date;
}