export class MediaAttachment {
  private constructor(
    private readonly _id: string,
    private readonly _type: MediaType,
    private readonly _url: string,
    private readonly _filename: string | null,
    private readonly _caption: string | null,
    private readonly _size: number | null,
    private readonly _mimeType: string
  ) {
    this.validate();
  }

  static create(
    id: string,
    type: MediaType,
    url: string,
    mimeType: string,
    filename?: string,
    caption?: string,
    size?: number
  ): MediaAttachment {
    return new MediaAttachment(
      id,
      type,
      url,
      filename || null,
      caption || null,
      size || null,
      mimeType
    );
  }

  static fromPersistence(data: {
    id: string;
    type: string;
    url: string;
    filename?: string;
    caption?: string;
    size?: number;
    mimeType: string;
  }): MediaAttachment {
    const type = MediaType[data.type as keyof typeof MediaType];
    return new MediaAttachment(
      data.id,
      type,
      data.url,
      data.filename || null,
      data.caption || null,
      data.size || null,
      data.mimeType
    );
  }

  get id(): string {
    return this._id;
  }

  get type(): MediaType {
    return this._type;
  }

  get url(): string {
    return this._url;
  }

  get filename(): string | null {
    return this._filename;
  }

  get caption(): string | null {
    return this._caption;
  }

  get size(): number | null {
    return this._size;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Media attachment ID cannot be empty');
    }

    if (!this._url || !this.isValidUrl(this._url)) {
      throw new Error('Media attachment URL must be a valid URL');
    }

    if (!this._mimeType || this._mimeType.trim().length === 0) {
      throw new Error('Media attachment MIME type cannot be empty');
    }

    if (this._size !== null && this._size <= 0) {
      throw new Error('Media attachment size must be positive');
    }

    this.validateMimeType();
  }

  private validateMimeType(): void {
    const validMimeTypes: Record<MediaType, string[]> = {
      [MediaType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      [MediaType.DOCUMENT]: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ],
      [MediaType.AUDIO]: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac'],
      [MediaType.VIDEO]: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm']
    };

    const allowedMimeTypes = validMimeTypes[this._type];
    if (!allowedMimeTypes.includes(this._mimeType)) {
      throw new Error(`MIME type ${this._mimeType} is not valid for media type ${this._type}`);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  toPersistence(): {
    id: string;
    type: string;
    url: string;
    filename?: string;
    caption?: string;
    size?: number;
    mimeType: string;
  } {
    return {
      id: this._id,
      type: this._type,
      url: this._url,
      filename: this._filename || undefined,
      caption: this._caption || undefined,
      size: this._size || undefined,
      mimeType: this._mimeType
    };
  }

  equals(other: MediaAttachment): boolean {
    return (
      this._id === other._id &&
      this._type === other._type &&
      this._url === other._url &&
      this._filename === other._filename &&
      this._caption === other._caption &&
      this._size === other._size &&
      this._mimeType === other._mimeType
    );
  }
}

export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video'
}