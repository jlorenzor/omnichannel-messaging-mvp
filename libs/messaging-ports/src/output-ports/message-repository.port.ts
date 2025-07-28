import { MessageId } from '../value-objects/message-id';
import { ConversationId } from '../value-objects/conversation-id';
import { MessageStatus } from './messaging-provider.port';

export interface IMessageRepositoryPort {
  save(message: Message): Promise<void>;
  findById(id: MessageId): Promise<Message | null>;
  findByConversation(conversationId: ConversationId): Promise<Message[]>;
  findByStatus(status: MessageStatus): Promise<Message[]>;
  updateStatus(id: MessageId, status: MessageStatus): Promise<void>;
  findByProvider(providerId: string): Promise<Message[]>;
  findByRecipient(recipient: string): Promise<Message[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Message[]>;
}

export interface Message {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly contactId: string;
  readonly content: any;
  readonly channelType: string;
  readonly providerType: string;
  readonly status: MessageStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata: Record<string, unknown>;
}