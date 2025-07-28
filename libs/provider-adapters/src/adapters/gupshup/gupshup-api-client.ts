import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface GupshupConfig {
  apiUrl: string;
  appName: string;
  apiKey: string;
  timeout: number;
}

export interface GupshupMessageRequest {
  source: string;
  destination: string;
  message: {
    type: string;
    text?: string;
    originalUrl?: string;
    previewUrl?: string;
    caption?: string;
    filename?: string;
  };
  'src.name': string;
}

export interface GupshupMessageResponse {
  status: string;
  messageId: string;
  code?: string;
  message?: string;
  retryAfter?: string;
  quotaRemaining?: string;
}

export interface GupshupStatusResponse {
  messageId: string;
  status: string;
  timestamp: string;
  eventType: string;
}

export interface GupshupTemplate {
  id: string;
  elementName: string;
  language: string;
  status: string;
  category: string;
  components: Array<{
    type: string;
    text?: string;
    buttons?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export interface GupshupMediaUploadResponse {
  mediaId: string;
  url: string;
  expiresAt?: string;
}

export class GupshupApiClient {
  private readonly httpClient: AxiosInstance;

  constructor(private readonly config: GupshupConfig) {
    this.httpClient = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': config.apiKey
      }
    });

    this.setupInterceptors();
  }

  async sendMessage(message: GupshupMessageRequest): Promise<GupshupMessageResponse> {
    try {
      const formData = this.convertToFormData(message);
      const response: AxiosResponse<GupshupMessageResponse> = await this.httpClient.post(
        '/sm/api/v1/msg',
        formData
      );
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<GupshupStatusResponse> {
    try {
      const response: AxiosResponse<GupshupStatusResponse> = await this.httpClient.get(
        `/sm/api/v1/msg/${messageId}/status`
      );
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getTemplates(): Promise<GupshupTemplate[]> {
    try {
      const response: AxiosResponse<{ templates: GupshupTemplate[] }> = await this.httpClient.get(
        `/partner/app/${this.config.appName}/templates`
      );
      
      return response.data.templates || [];
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async uploadMedia(media: { file: Buffer; filename: string; mimeType: string }): Promise<GupshupMediaUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([media.file], { type: media.mimeType }), media.filename);
      
      const response: AxiosResponse<GupshupMediaUploadResponse> = await this.httpClient.post(
        '/sm/api/v1/media',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  private convertToFormData(message: GupshupMessageRequest): string {
    const params = new URLSearchParams();
    
    params.append('channel', 'whatsapp');
    params.append('source', message.source);
    params.append('destination', message.destination);
    params.append('message', JSON.stringify(message.message));
    params.append('src.name', message['src.name']);
    
    return params.toString();
  }

  private setupInterceptors(): void {
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`Gupshup API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Gupshup API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`Gupshup API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: any): void {
    if (error.response) {
      console.error('Gupshup API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('Gupshup API No Response:', error.request);
    } else {
      console.error('Gupshup API Error:', error.message);
    }
  }
}