import { Injectable } from '@nestjs/common';
import { IMessageRepositoryPort } from '@omnichannel/messaging-ports';
import { Message, MessageId, ConversationId, MessageStatus } from '@omnichannel/domain';

@Injectable()
export class InMemoryMessageRepository implements IMessageRepositoryPort {
  private messages: Map<string, Message> = new Map();

  async save(message: Message): Promise<void> {
    this.messages.set(message.id.value, message);
  }

  async findById(id: MessageId): Promise<Message | null> {
    return this.messages.get(id.value) || null;
  }

  async findByConversation(conversationId: ConversationId): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId.equals(conversationId));
  }

  async findByStatus(status: MessageStatus): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.status.equals(status));
  }

  async updateStatus(id: MessageId, status: MessageStatus): Promise<void> {
    const message = this.messages.get(id.value);
    if (message) {
      message.updateStatus(status);
    }
  }

  async findByProvider(providerId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.providerType.value === providerId);
  }

  async findByRecipient(recipient: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.metadata['recipient'] === recipient);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.createdAt >= startDate && message.createdAt <= endDate
      );
  }

  // Additional methods for testing and debugging
  async count(): Promise<number> {
    return this.messages.size;
  }

  async clear(): Promise<void> {
    this.messages.clear();
  }

  async getAll(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
}