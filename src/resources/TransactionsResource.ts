import { KambaClient } from '../client';
import { RequestOptions, TransactionEventParams, TransactionEventResponse, TransactionTemplate,
  TransactionTemplateParams, TransactionsOverview } from '../types';
import { requireObject, requireText, resourceId, validateAngolanPhone, validateEmail, validateKey } from '../validators';
import { KambaValidationError } from '../errors';

const channelSet = new Set(['sms', 'email']);
function validateChannels(channels: string[]): void {
  if (!Array.isArray(channels) || !channels.length || channels.some(channel => !channelSet.has(channel))) {
    throw new KambaValidationError('channels deve conter sms e/ou email.');
  }
}
export class TransactionsResource {
  constructor(private client: KambaClient) {}
  overview(options?: RequestOptions): Promise<TransactionsOverview> { return this.client.request('/transactions/overview', {}, options); }
  async createTemplate(params: TransactionTemplateParams, options?: RequestOptions): Promise<TransactionTemplate> {
    validateKey(params.key, 'key'); validateKey(params.eventType, 'eventType'); requireText(params.name, 'name'); validateChannels(params.channels);
    if (params.channels.includes('sms')) requireText(params.smsBody as string, 'smsBody');
    if (params.channels.includes('email')) {
      requireText(params.emailSubject as string, 'emailSubject'); requireText(params.emailHtml as string, 'emailHtml');
      requireText(params.domainId as string, 'domainId'); requireText(params.fromLocal as string, 'fromLocal');
    }
    return this.client.request('/transactions/templates', { method: 'POST', body: JSON.stringify({
      key: params.key, event_type: params.eventType, name: params.name, channels: params.channels,
      sms_body: params.smsBody, email_subject: params.emailSubject, email_html: params.emailHtml,
      domain_id: params.domainId, from_local: params.fromLocal,
    }) }, options);
  }
  setTemplateActive(id: string, active: boolean, options?: RequestOptions): Promise<{ id: string; active: boolean }> {
    return this.client.request(`/transactions/templates/${resourceId(id)}`, { method: 'PATCH', body: JSON.stringify({ active }) }, options);
  }
  async sendEvent(params: TransactionEventParams, options?: RequestOptions): Promise<TransactionEventResponse> {
    validateKey(params.event, 'event'); validateKey(params.templateKey, 'templateKey'); requireText(params.externalReference, 'externalReference');
    if (params.externalReference.length > 160) throw new KambaValidationError('externalReference aceita até 160 caracteres.');
    requireObject(params.customer, 'customer'); const data = params.data ?? {}; requireObject(data, 'data');
    if (params.channels) validateChannels(params.channels);
    const channels = params.channels ?? [];
    if (channels.includes('sms')) validateAngolanPhone(params.customer.phone as string);
    if (channels.includes('email')) validateEmail(params.customer.email as string, 'customer.email');
    return this.client.request('/transactions/events', { method: 'POST', body: JSON.stringify({
      event: params.event, template_key: params.templateKey, external_reference: params.externalReference,
      environment: params.environment, customer: params.customer, data, channels: params.channels,
    }) }, options);
  }
}
