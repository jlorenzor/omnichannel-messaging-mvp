import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  graphApiUrl: string;
  apiVersion: string;
  timeout: number;
}

export interface MetaMessageRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    id?: string;
    link?: string;
  };
  video?: {
    id?: string;
    link?: string;
    caption?: string;
  };
}

export interface MetaMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface MetaStatusResponse {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  error?: {
    code: number;
    title: string;
    message: string;
  };
}

export interface MetaTemplate {
  name: string;
  components: Array<{
    type: string;
    format?: string;
    text?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phone_number?: string;
    }>;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
  }>;
  language: string;
  status: string;
  category: string;
  id: string;
}

export interface MetaMediaUploadResponse {
  id: string;
  url?: string;
}

export class MetaApiClient {
  private readonly httpClient: AxiosInstance;

  constructor(private readonly config: MetaConfig) {
    this.httpClient = axios.create({
      baseURL: `${config.graphApiUrl}/${config.apiVersion}`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });

    this.setupInterceptors();
  }

  async sendMessage(message: MetaMessageRequest): Promise<MetaMessageResponse> {
    try {
      const response: AxiosResponse<MetaMessageResponse> = await this.httpClient.post(
        `/${this.config.phoneNumberId}/messages`,
        message
      );
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<MetaStatusResponse> {
    try {
      const response: AxiosResponse<MetaStatusResponse> = await this.httpClient.get(
        `/${messageId}`
      );
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getTemplates(): Promise<MetaTemplate[]> {
    try {
      const response: AxiosResponse<{ data: MetaTemplate[] }> = await this.httpClient.get(
        `/${this.config.businessAccountId}/message_templates`,
        {
          params: {
            fields: 'name,components,language,status,category,id'
          }
        }
      );
      
      return response.data.data || [];
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async uploadMedia(media: { file: Buffer; filename: string; mimeType: string }): Promise<MetaMediaUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([media.file], { type: media.mimeType }), media.filename);
      formData.append('type', media.mimeType);
      formData.append('messaging_product', 'whatsapp');
      
      const response: AxiosResponse<MetaMediaUploadResponse> = await this.httpClient.post(
        `/${this.config.phoneNumberId}/media`,
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

  async getMediaUrl(mediaId: string): Promise<{ url: string }> {
    try {
      const response: AxiosResponse<{ url: string }> = await this.httpClient.get(
        `/${mediaId}`
      );
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`Meta API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Meta API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`Meta API Response: ${response.status} ${response.config.url}`);
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
      // Server responded with error status
      console.error('Meta API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Extract Meta-specific error information
      if (error.response.data?.error) {
        const metaError = error.response.data.error;
        console.error('Meta Error Details:', {
          code: metaError.code,
          type: metaError.type,
          message: metaError.message,
          subcode: metaError.error_subcode,
          fbtrace_id: metaError.fbtrace_id
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Meta API No Response:', error.request);
    } else {
      // Something else happened
      console.error('Meta API Error:', error.message);
    }
  }
}