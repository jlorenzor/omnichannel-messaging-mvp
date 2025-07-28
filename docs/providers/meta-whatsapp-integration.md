# Meta WhatsApp Cloud API Integration

This document describes the integration with Meta's WhatsApp Cloud API for sending and receiving WhatsApp messages.

## Overview

The Meta WhatsApp adapter implements the `IMessagingProviderPort` interface to provide WhatsApp messaging capabilities through Meta's Graph API.

## Configuration

### Required Environment Variables

```env
# Meta WhatsApp Configuration
META_ACCESS_TOKEN=your_access_token
META_PHONE_NUMBER_ID=your_phone_number_id
META_BUSINESS_ACCOUNT_ID=your_business_account_id
META_GRAPH_API_URL=https://graph.facebook.com
META_API_VERSION=v18.0
META_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
META_APP_SECRET=your_app_secret
META_TIMEOUT=10000
```

### Setup Steps

1. **Create a Meta Business Account**
   - Go to [Meta Business Manager](https://business.facebook.com/)
   - Create or select a business account

2. **Set up WhatsApp Business API**
   - Navigate to WhatsApp Business API
   - Create a new app or use existing
   - Generate access token with required permissions

3. **Configure Phone Number**
   - Add and verify your business phone number
   - Note the Phone Number ID for configuration

4. **Webhook Configuration**
   - Set webhook URL: `https://your-domain.com/webhooks/meta`
   - Configure webhook fields: `messages`, `message_deliveries`, `message_reads`
   - Set verification token

## API Endpoints

### Send Message
```typescript
POST /{phone-number-id}/messages

// Text Message
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "text",
  "text": {
    "body": "Hello, World!"
  }
}

// Template Message
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "en_US"
    }
  }
}

// Media Message
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Check out this image!"
  }
}
```

### Upload Media
```typescript
POST /{phone-number-id}/media

// Form Data
file: [binary]
type: "image/jpeg"
messaging_product: "whatsapp"
```

### Get Templates
```typescript
GET /{business-account-id}/message_templates
```

## Webhook Events

### Message Status Updates
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "statuses": [{
          "id": "MESSAGE_ID",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "1234567890",
          "conversation": {
            "id": "CONVERSATION_ID",
            "origin": {
              "type": "business_initiated"
            }
          },
          "pricing": {
            "billable": true,
            "pricing_model": "CBP",
            "category": "business_initiated"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Incoming Messages
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": {
            "name": "John Doe"
          },
          "wa_id": "1234567890"
        }],
        "messages": [{
          "from": "1234567890",
          "id": "MESSAGE_ID",
          "timestamp": "1234567890",
          "text": {
            "body": "Hello!"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

## Error Handling

### Common Error Codes

- **100**: Invalid parameter
- **190**: Access token invalid or expired
- **200**: Missing permissions
- **4**: Rate limit exceeded
- **17**: User request limit reached
- **613**: Calls to this API have exceeded the rate limit
- **80007**: Message quota exceeded

### Error Response Format
```json
{
  "error": {
    "message": "Invalid phone number",
    "type": "OAuthException",
    "code": 100,
    "error_subcode": 33,
    "fbtrace_id": "trace_id"
  }
}
```

## Rate Limits

- **Cloud API**: 1000 requests per second per phone number
- **Business Initiated Conversations**: 1000 per 24 hours (with approved templates)
- **User Initiated Conversations**: Unlimited within 24-hour window

## Security

### Webhook Signature Verification

Meta signs webhook payloads using HMAC-SHA256:

```typescript
const signature = 'sha256=' + crypto
  .createHmac('sha256', APP_SECRET)
  .update(payload, 'utf8')
  .digest('hex');
```

Compare this with the `X-Hub-Signature-256` header.

### Token Management

- Store access tokens securely
- Rotate tokens regularly
- Use least privilege permissions
- Monitor token usage and expiration

## Best Practices

1. **Message Templates**
   - Pre-approve all template messages
   - Use placeholders for dynamic content
   - Follow Meta's template guidelines

2. **Media Handling**
   - Upload media before sending
   - Use appropriate file formats and sizes
   - Implement proper error handling for uploads

3. **Webhook Processing**
   - Respond with 200 status quickly
   - Process events asynchronously
   - Implement proper retry logic
   - Validate webhook signatures

4. **Error Handling**
   - Implement exponential backoff for retries
   - Log errors with trace IDs
   - Monitor error rates and patterns

## Testing

### Test Phone Numbers

Meta provides test phone numbers for development:
- Use the test phone numbers provided in your app dashboard
- Test all message types (text, template, media)
- Verify webhook event handling

### Postman Collection

Use the official Meta WhatsApp API Postman collection for testing:
- Import from Meta's documentation
- Configure environment variables
- Test all endpoints

## Migration from Gupshup

### Key Differences

1. **API Format**: JSON vs Form Data
2. **Authentication**: Bearer token vs API key
3. **Phone Numbers**: Without '+' prefix
4. **Webhooks**: Different payload structure
5. **Media**: Upload then reference vs direct URL

### Migration Steps

1. Set up Meta Business Account
2. Configure webhook endpoints
3. Update message formatting
4. Test thoroughly with both providers
5. Implement gradual rollout

## Support

- [Meta for Developers](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Community Forum](https://developers.facebook.com/community/)
