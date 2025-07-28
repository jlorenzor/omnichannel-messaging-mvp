import { randomUUID } from 'crypto';

export class ContactId {
  private constructor(private readonly _value: string) {
    this.validate(_value);
  }

  static generate(): ContactId {
    return new ContactId(randomUUID());
  }

  static fromString(value: string): ContactId {
    return new ContactId(value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ContactId cannot be empty');
    }

    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('ContactId must be a valid UUID v4');
    }
  }

  equals(other: ContactId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}