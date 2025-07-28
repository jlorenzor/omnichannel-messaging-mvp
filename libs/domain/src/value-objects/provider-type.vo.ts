export class ProviderType {
  private constructor(private readonly _value: ProviderTypeEnum) {}

  static gupshup(): ProviderType {
    return new ProviderType(ProviderTypeEnum.GUPSHUP);
  }

  static meta(): ProviderType {
    return new ProviderType(ProviderTypeEnum.META);
  }

  static twilio(): ProviderType {
    return new ProviderType(ProviderTypeEnum.TWILIO);
  }

  static sendgrid(): ProviderType {
    return new ProviderType(ProviderTypeEnum.SENDGRID);
  }

  static fromString(value: string): ProviderType {
    const providerType = ProviderTypeEnum[value.toUpperCase() as keyof typeof ProviderTypeEnum];
    if (!providerType) {
      throw new Error(`Invalid provider type: ${value}`);
    }
    return new ProviderType(providerType);
  }

  get value(): string {
    return this._value.toLowerCase();
  }

  isGupshup(): boolean {
    return this._value === ProviderTypeEnum.GUPSHUP;
  }

  isMeta(): boolean {
    return this._value === ProviderTypeEnum.META;
  }

  isTwilio(): boolean {
    return this._value === ProviderTypeEnum.TWILIO;
  }

  isSendgrid(): boolean {
    return this._value === ProviderTypeEnum.SENDGRID;
  }

  equals(other: ProviderType): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this.value;
  }
}

enum ProviderTypeEnum {
  GUPSHUP = 'GUPSHUP',
  META = 'META',
  TWILIO = 'TWILIO',
  SENDGRID = 'SENDGRID',
  AWS_SNS = 'AWS_SNS',
  AWS_SES = 'AWS_SES'
}