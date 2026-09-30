import { KambaClient } from '../client';
import { SendSmsParams, SendSmsResponse, SendBulkParams, SendBulkResponse, ScheduleSmsParams,
  ScheduleSmsResponse, RequestOptions, BulkJob, BulkJobDetail, ScheduledMessage, SuccessResponse } from '../types';
import { validateAngolanPhone, validateMessageContent, validateSenderId, requireText, telegramPayload, resourceId } from '../validators';
import { KambaValidationError } from '../errors';

export class SmsResource {
  constructor(private client: KambaClient) {}

  async send(params: SendSmsParams, options?: RequestOptions): Promise<SendSmsResponse> {
    validateAngolanPhone(params.to);
    validateMessageContent(params.text);
    return this.client.request('/messages/send', { method: 'POST', body: JSON.stringify({
      to: params.to, text: params.text, sender_id: params.senderId, ...telegramPayload(params),
    }) }, options);
  }

  async sendBulk(params: SendBulkParams, options?: RequestOptions): Promise<SendBulkResponse> {
    requireText(params.name, 'name');
    validateSenderId(params.senderId);
    validateMessageContent(params.text);
    if (!Array.isArray(params.recipients) || params.recipients.length === 0) {
      throw new KambaValidationError('recipients deve ser uma lista não vazia.');
    }
    params.recipients.forEach(validateAngolanPhone);
    return this.client.request('/messages/bulk', { method: 'POST', body: JSON.stringify({
      name: params.name, sender_id: params.senderId, text: params.text, recipients: params.recipients,
    }) }, options);
  }

  async schedule(params: ScheduleSmsParams, options?: RequestOptions): Promise<ScheduleSmsResponse> {
    validateAngolanPhone(params.to);
    validateMessageContent(params.text);
    validateSenderId(params.senderId);
    const date = new Date(params.scheduledAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      throw new KambaValidationError('scheduledAt deve ser uma data válida no futuro.');
    }
    return this.client.request('/messages/schedule', { method: 'POST', body: JSON.stringify({
      to: params.to, text: params.text, sender_id: params.senderId, scheduled_at: date.toISOString(),
    }) }, options);
  }
  listBulk(options?: RequestOptions): Promise<BulkJob[]> {
    return this.client.request('/messages/bulk', {}, options);
  }
  getBulk(id: string, options?: RequestOptions): Promise<BulkJobDetail> {
    return this.client.request(`/messages/bulk/${resourceId(id)}`, {}, options);
  }
  listScheduled(options?: RequestOptions): Promise<ScheduledMessage[]> {
    return this.client.request('/messages/scheduled', {}, options);
  }
  cancelScheduled(id: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this.client.request(`/messages/scheduled/${resourceId(id)}`, { method: 'DELETE' }, options);
  }
}
