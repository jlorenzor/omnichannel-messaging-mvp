export class ChannelType {
  private constructor(private readonly _value: ChannelTypeEnum) {}

  static whatsapp(): ChannelType {
    return new ChannelType(ChannelTypeEnum.WHATSAPP);
  }

  static sms(): ChannelType {
    return new ChannelType(ChannelTypeEnum.SMS);
  }

  static email(): ChannelType {
    return new ChannelType(ChannelTypeEnum.EMAIL);
  }

  static instagram(): ChannelType {
    return new ChannelType(ChannelTypeEnum.INSTAGRAM);
  }

  static voice(): ChannelType {
    return new ChannelType(ChannelTypeEnum.VOICE);
  }

  static fromString(value: string): ChannelType {
    const channelType = ChannelTypeEnum[value.toUpperCase() as keyof typeof ChannelTypeEnum];
    if (!channelType) {
      throw new Error(`Invalid channel type: ${value}`);
    }
    return new ChannelType(channelType);
  }

  get value(): string {
    return this._value.toLowerCase();
  }

  isWhatsApp(): boolean {
    return this._value === ChannelTypeEnum.WHATSAPP;
  }

  isSms(): boolean {
    return this._value === ChannelTypeEnum.SMS;
  }

  isEmail(): boolean {
    return this._value === ChannelTypeEnum.EMAIL;
  }

  isInstagram(): boolean {
    return this._value === ChannelTypeEnum.INSTAGRAM;
  }

  isVoice(): boolean {
    return this._value === ChannelTypeEnum.VOICE;
  }

  equals(other: ChannelType): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this.value;
  }
}

enum ChannelTypeEnum {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  INSTAGRAM = 'INSTAGRAM',
  VOICE = 'VOICE'
}