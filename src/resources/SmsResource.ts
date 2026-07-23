import { KambaClient } from '../client';
import { 
  SendSmsParams, SendSmsResponse, 
  SendBulkParams, SendBulkResponse, 
  ScheduleSmsParams, ScheduleSmsResponse 
} from '../types';
import { validateAngolanPhone, validateMessageContent } from '../validators';

export class SmsResource {
  constructor(private client: KambaClient) {}

  async send(params: SendSmsParams): Promise<SendSmsResponse> {
    validateAngolanPhone(params.to);
    validateMessageContent(params.text);

    return this.client.request<SendSmsResponse>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        to: params.to,
        text: params.text,
        sender_id: params.senderId,
      }),
    });
  }

  async sendBulk(params: SendBulkParams): Promise<SendBulkResponse> {
    validateMessageContent(params.text);
    
    // Validar todos os números do array
    params.recipients.forEach(phone => validateAngolanPhone(phone));

    if (params.recipients.length > 1000) {
      throw new Error('O limite máximo é de 1000 destinatários por envio em massa.');
    }

    return this.client.request<SendBulkResponse>('/messages/bulk', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        sender_id: params.senderId,
        text: params.text,
        recipients: params.recipients,
      }),
    });
  }

  async schedule(params: ScheduleSmsParams): Promise<ScheduleSmsResponse> {
    validateAngolanPhone(params.to);
    validateMessageContent(params.text);

    const scheduledAt = params.scheduledAt instanceof Date 
      ? params.scheduledAt.toISOString() 
      : params.scheduledAt;

    return this.client.request<ScheduleSmsResponse>('/messages/schedule', {
      method: 'POST',
      body: JSON.stringify({
        to: params.to,
        text: params.text,
        sender_id: params.senderId,
        scheduled_at: scheduledAt,
      }),
    });
  }
}