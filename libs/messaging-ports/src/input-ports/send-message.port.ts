export interface ISendMessagePort {
  execute(command: SendMessageCommand): Promise<SendMessageResult>;
}

export interface SendMessageCommand {
  readonly recipient: string;
  readonly content: MessageContent;
  readonly channelType: ChannelType;
  readonly templateId?: string;
  readonly mediaAttachments?: MediaAttachment[];
  readonly metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  readonly messageId: string;
  readonly status: MessageStatus;
  readonly providerId: string;
  readonly estimatedDeliveryTime?: Date;
  readonly errors?: string[];
}

export interface MessageContent {
  readonly text?: string;
  readonly type: MessageContentType;
  readonly parameters?: Record<string, string>;
}

export enum ChannelType {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  INSTAGRAM = 'instagram',
  VOICE = 'voice'
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  REJECTED = 'rejected'
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