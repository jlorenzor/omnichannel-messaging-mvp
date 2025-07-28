import { MediaAttachment } from './media-attachment.vo';

export class MessageContent {
  private constructor(
    private readonly _text: string | null,
    private readonly _type: MessageContentType,
    private readonly _templateId: string | null,
    private readonly _parameters: Record<string, string>,
    private readonly _mediaAttachments: MediaAttachment[]
  ) {
    this.validate();
  }

  static createText(text: string): MessageContent {
    return new MessageContent(
      text,
      MessageContentType.TEXT,
      null,
      {},
      []
    );
  }

  static createTemplate(
    templateId: string,
    parameters: Record<string, string> = {}
  ): MessageContent {
    return new MessageContent(
      null,
      MessageContentType.TEMPLATE,
      templateId,
      parameters,
      []
    );
  }

  static createMedia(
    type: MessageContentType,
    mediaAttachment: MediaAttachment,
    caption?: string
  ): MessageContent {
    if (![MessageContentType.IMAGE, MessageContentType.DOCUMENT, MessageContentType.AUDIO, MessageContentType.VIDEO].includes(type)) {
      throw new Error('Invalid media content type');
    }

    return new MessageContent(
      caption || null,
      type,
      null,
      {},
      [mediaAttachment]
    );
  }

  static fromPersistence(data: {
    text?: string;
    type: string;
    templateId?: string;
    parameters?: Record<string, string>;
    mediaAttachments?: any[];
  }): MessageContent {
    const type = MessageContentType[data.type as keyof typeof MessageContentType];
    const attachments = data.mediaAttachments?.map(att => MediaAttachment.fromPersistence(att)) || [];

    return new MessageContent(
      data.text || null,
      type,
      data.templateId || null,
      data.parameters || {},
      attachments
    );
  }

  get text(): string | null {
    return this._text;
  }

  get type(): MessageContentType {
    return this._type;
  }

  get templateId(): string | null {
    return this._templateId;
  }

  get parameters(): Record<string, string> {
    return { ...this._parameters };
  }

  get mediaAttachments(): MediaAttachment[] {
    return [...this._mediaAttachments];
  }

  isTemplate(): boolean {
    return this._type === MessageContentType.TEMPLATE;
  }

  isText(): boolean {
    return this._type === MessageContentType.TEXT;
  }

  hasMedia(): boolean {
    return this._mediaAttachments.length > 0 || 
           [MessageContentType.IMAGE, MessageContentType.DOCUMENT, MessageContentType.AUDIO, MessageContentType.VIDEO]
           .includes(this._type);
  }

  private validate(): void {
    switch (this._type) {
      case MessageContentType.TEXT:
        if (!this._text || this._text.trim().length === 0) {
          throw new Error('Text content cannot be empty');
        }
        if (this._text.length > 4096) {
          throw new Error('Text content cannot exceed 4096 characters');
        }
        break;

      case MessageContentType.TEMPLATE:
        if (!this._templateId || this._templateId.trim().length === 0) {
          throw new Error('Template ID is required for template messages');
        }
        break;

      case MessageContentType.IMAGE:
      case MessageContentType.DOCUMENT:
      case MessageContentType.AUDIO:
      case MessageContentType.VIDEO:
        if (this._mediaAttachments.length === 0) {
          throw new Error(`Media attachment is required for ${this._type} messages`);
        }
        break;

      default:
        throw new Error(`Unsupported message content type: ${this._type}`);
    }
  }

  toPersistence(): {
    text?: string;
    type: string;
    templateId?: string;
    parameters: Record<string, string>;
    mediaAttachments: any[];
  } {
    return {
      text: this._text || undefined,
      type: this._type,
      templateId: this._templateId || undefined,
      parameters: this._parameters,
      mediaAttachments: this._mediaAttachments.map(att => att.toPersistence())
    };
  }

  equals(other: MessageContent): boolean {
    return (
      this._text === other._text &&
      this._type === other._type &&
      this._templateId === other._templateId &&
      JSON.stringify(this._parameters) === JSON.stringify(other._parameters) &&
      this._mediaAttachments.length === other._mediaAttachments.length &&
      this._mediaAttachments.every((att, idx) => att.equals(other._mediaAttachments[idx]))
    );
  }
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