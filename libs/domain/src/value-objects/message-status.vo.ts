export class MessageStatus {
  private constructor(private readonly _value: MessageStatusType) {}

  static pending(): MessageStatus {
    return new MessageStatus(MessageStatusType.PENDING);
  }

  static sent(): MessageStatus {
    return new MessageStatus(MessageStatusType.SENT);
  }

  static delivered(): MessageStatus {
    return new MessageStatus(MessageStatusType.DELIVERED);
  }

  static read(): MessageStatus {
    return new MessageStatus(MessageStatusType.READ);
  }

  static failed(): MessageStatus {
    return new MessageStatus(MessageStatusType.FAILED);
  }

  static rejected(): MessageStatus {
    return new MessageStatus(MessageStatusType.REJECTED);
  }

  static fromString(value: string): MessageStatus {
    const statusType = MessageStatusType[value.toUpperCase() as keyof typeof MessageStatusType];
    if (!statusType) {
      throw new Error(`Invalid message status: ${value}`);
    }
    return new MessageStatus(statusType);
  }

  get value(): string {
    return this._value.toLowerCase();
  }

  isPending(): boolean {
    return this._value === MessageStatusType.PENDING;
  }

  isSent(): boolean {
    return this._value === MessageStatusType.SENT;
  }

  isDelivered(): boolean {
    return this._value === MessageStatusType.DELIVERED;
  }

  isRead(): boolean {
    return this._value === MessageStatusType.READ;
  }

  isFailed(): boolean {
    return this._value === MessageStatusType.FAILED;
  }

  isRejected(): boolean {
    return this._value === MessageStatusType.REJECTED;
  }

  isTerminal(): boolean {
    return this._value === MessageStatusType.READ || 
           this._value === MessageStatusType.REJECTED;
  }

  equals(other: MessageStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this.value;
  }
}

enum MessageStatusType {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED'
}