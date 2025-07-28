import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SendWhatsAppMessageUseCase } from '../../../application/use-cases/send-whatsapp-message.use-case';
import { ProcessWhatsAppWebhookUseCase } from '../../../application/use-cases/process-whatsapp-webhook.use-case';
import { ProviderSelectionService } from '../../../application/services/provider-selection.service';
import { SendMessageCommand, ProcessWebhookCommand } from '@omnichannel/messaging-ports';

export class SendMessageDto {
  recipient: string;
  content: {
    type: 'text' | 'template';
    text?: string;
    templateId?: string;
    parameters?: Record<string, string>;
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class WebhookDto {
  provider: string;
  signature: string;
  payload: any;
}

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly sendMessageUseCase: SendWhatsAppMessageUseCase,
    private readonly processWebhookUseCase: ProcessWhatsAppWebhookUseCase,
    private readonly providerSelectionService: ProviderSelectionService
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send WhatsApp message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(@Body() dto: SendMessageDto) {
    const command: SendMessageCommand = {
      recipient: dto.recipient,
      content: {
        type: dto.content.type as any,
        text: dto.content.text,
        parameters: dto.content.parameters
      },
      channelType: 'whatsapp' as any,
      templateId: dto.content.templateId,
      metadata: {
        priority: dto.priority || 'normal',
        recipient: dto.recipient
      }
    };

    return await this.sendMessageUseCase.execute(command);
  }

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Process WhatsApp webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async processWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Query('signature') signature?: string
  ) {
    const command: ProcessWebhookCommand = {
      provider: provider as any,
      payload,
      signature: signature || '',
      headers: {},
      timestamp: new Date()
    };

    return await this.processWebhookUseCase.execute(command);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available providers' })
  @ApiResponse({ status: 200, description: 'List of available providers' })
  async getProviders() {
    return {
      providers: this.providerSelectionService.getAvailableProviders(),
      health: this.providerSelectionService.getAllProviderHealth()
    };
  }

  @Get('providers/:providerId/health')
  @ApiOperation({ summary: 'Get provider health status' })
  @ApiResponse({ status: 200, description: 'Provider health status' })
  async getProviderHealth(@Param('providerId') providerId: string) {
    const health = this.providerSelectionService.getProviderHealth(providerId);
    
    if (!health) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    return health;
  }

  @Post('templates/:templateId/send')
  @ApiOperation({ summary: 'Send template message' })
  @ApiResponse({ status: 201, description: 'Template message sent successfully' })
  async sendTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: { recipient: string; parameters?: Record<string, string> }
  ) {
    const command: SendMessageCommand = {
      recipient: dto.recipient,
      content: {
        type: 'template' as any,
        parameters: dto.parameters
      },
      channelType: 'whatsapp' as any,
      templateId: templateId,
      metadata: {
        recipient: dto.recipient
      }
    };

    return await this.sendMessageUseCase.execute(command);
  }
}