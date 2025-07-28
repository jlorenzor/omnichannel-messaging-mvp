import { randomUUID } from 'crypto';

export class ConversationId {
  private constructor(private readonly _value: string) {
    this.validate(_value);
  }

  static generate(): ConversationId {
    return new ConversationId(randomUUID());
  }

  static fromString(value: string): ConversationId {
    return new ConversationId(value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ConversationId cannot be empty');
    }

    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('ConversationId must be a valid UUID v4');
    }
  }

  equals(other: ConversationId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}