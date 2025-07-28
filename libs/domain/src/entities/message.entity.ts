import { MessageId } from '../value-objects/message-id.vo';
import { MessageContent } from '../value-objects/message-content.vo';
import { MessageStatus } from '../value-objects/message-status.vo';
import { ContactId } from '../value-objects/contact-id.vo';
import { ConversationId } from '../value-objects/conversation-id.vo';
import { ChannelType } from '../value-objects/channel-type.vo';
import { ProviderType } from '../value-objects/provider-type.vo';

export class Message {
  private constructor(
    private readonly _id: MessageId,
    private readonly _conversationId: ConversationId,
    private readonly _contactId: ContactId,
    private readonly _content: MessageContent,
    private readonly _channelType: ChannelType,
    private readonly _providerType: ProviderType,
    private _status: MessageStatus,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private readonly _metadata: Record<string, unknown> = {}
  ) {}

  static create(
    conversationId: ConversationId,
    contactId: ContactId,
    content: MessageContent,
    channelType: ChannelType,
    providerType: ProviderType,
    metadata?: Record<string, unknown>
  ): Message {
    const id = MessageId.generate();
    const status = MessageStatus.pending();
    const now = new Date();

    return new Message(
      id,
      conversationId,
      contactId,
      content,
      channelType,
      providerType,
      status,
      now,
      now,
      metadata || {}
    );
  }

  static fromPersistence(data: {
    id: string;
    conversationId: string;
    contactId: string;
    content: any;
    channelType: string;
    providerType: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
  }): Message {
    return new Message(
      MessageId.fromString(data.id),
      ConversationId.fromString(data.conversationId),
      ContactId.fromString(data.contactId),
      MessageContent.fromPersistence(data.content),
      ChannelType.fromString(data.channelType),
      ProviderType.fromString(data.providerType),
      MessageStatus.fromString(data.status),
      data.createdAt,
      data.updatedAt,
      data.metadata || {}
    );
  }

  get id(): MessageId {
    return this._id;
  }

  get conversationId(): ConversationId {
    return this._conversationId;
  }

  get contactId(): ContactId {
    return this._contactId;
  }

  get content(): MessageContent {
    return this._content;
  }

  get channelType(): ChannelType {
    return this._channelType;
  }

  get providerType(): ProviderType {
    return this._providerType;
  }

  get status(): MessageStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  updateStatus(newStatus: MessageStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status.value} to ${newStatus.value}`);
    }
    
    this._status = newStatus;
    this._updatedAt = new Date();
  }

  markAsSent(providerMessageId: string): void {
    this.updateStatus(MessageStatus.sent());
    this._metadata['providerMessageId'] = providerMessageId;
    this._metadata['sentAt'] = new Date().toISOString();
  }

  markAsDelivered(): void {
    this.updateStatus(MessageStatus.delivered());
    this._metadata['deliveredAt'] = new Date().toISOString();
  }

  markAsRead(): void {
    this.updateStatus(MessageStatus.read());
    this._metadata['readAt'] = new Date().toISOString();
  }

  markAsFailed(error: string): void {
    this.updateStatus(MessageStatus.failed());
    this._metadata['error'] = error;
    this._metadata['failedAt'] = new Date().toISOString();
  }

  retry(): void {
    if (!this._status.isFailed()) {
      throw new Error('Can only retry failed messages');
    }

    const retryCount = (this._metadata['retryCount'] as number) || 0;
    if (retryCount >= 3) {
      throw new Error('Maximum retry attempts reached');
    }

    this._status = MessageStatus.pending();
    this._metadata['retryCount'] = retryCount + 1;
    this._metadata['retriedAt'] = new Date().toISOString();
    this._updatedAt = new Date();
  }

  isTemplate(): boolean {
    return this._content.isTemplate();
  }

  hasMedia(): boolean {
    return this._content.hasMedia();
  }

  private canTransitionTo(newStatus: MessageStatus): boolean {
    const currentStatus = this._status.value;
    const targetStatus = newStatus.value;

    const validTransitions: Record<string, string[]> = {
      'pending': ['sent', 'failed'],
      'sent': ['delivered', 'failed'],
      'delivered': ['read', 'failed'],
      'failed': ['pending'], // For retry
      'read': [], // Terminal state
      'rejected': [] // Terminal state
    };

    return validTransitions[currentStatus]?.includes(targetStatus) || false;
  }

  toPersistence(): {
    id: string;
    conversationId: string;
    contactId: string;
    content: any;
    channelType: string;
    providerType: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, unknown>;
  } {
    return {
      id: this._id.value,
      conversationId: this._conversationId.value,
      contactId: this._contactId.value,
      content: this._content.toPersistence(),
      channelType: this._channelType.value,
      providerType: this._providerType.value,
      status: this._status.value,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      metadata: this._metadata
    };
  }

  equals(other: Message): boolean {
    return this._id.equals(other._id);
  }
}