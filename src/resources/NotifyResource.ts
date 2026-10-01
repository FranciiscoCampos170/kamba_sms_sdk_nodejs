import { KambaClient } from '../client';
import { NotifyDelivery, NotifyRenderParams, NotifyRenderResponse, NotifySendParams, NotifySendResponse,
  NotifyTemplate, NotifyTemplateParams, RequestOptions, SuccessResponse } from '../types';
import { requireObject, requireText, resourceId, validateAngolanPhone, validateKey, validateSenderId } from '../validators';
import { KambaValidationError } from '../errors';

export class NotifyResource {
  constructor(private client: KambaClient) {}
  async createTemplate(params: NotifyTemplateParams, options?: RequestOptions): Promise<NotifyTemplate> {
    validateKey(params.key, 'key', 50); requireText(params.name, 'name'); requireText(params.body, 'body');
    if (params.name.length > 100 || params.body.length > 1000) throw new KambaValidationError('name aceita 100 e body 1000 caracteres.');
    return this.client.request('/notify/templates', { method: 'POST', body: JSON.stringify(params) }, options);
  }
  listTemplates(options?: RequestOptions): Promise<NotifyTemplate[]> { return this.client.request('/notify/templates', {}, options); }
  disableTemplate(id: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this.client.request(`/notify/templates/${resourceId(id)}`, { method: 'DELETE' }, options);
  }
  async render(params: NotifyRenderParams, options?: RequestOptions): Promise<NotifyRenderResponse> {
    validateKey(params.templateKey, 'templateKey', 50); const variables = params.variables ?? {}; requireObject(variables, 'variables');
    return this.client.request('/notify/render', { method: 'POST', body: JSON.stringify({ template_key: params.templateKey, variables }) }, options);
  }
  async send(params: NotifySendParams, options?: RequestOptions): Promise<NotifySendResponse> {
    validateAngolanPhone(params.to); validateKey(params.templateKey, 'templateKey', 50);
    if (params.senderId !== undefined) validateSenderId(params.senderId);
    const variables = params.variables ?? {}; requireObject(variables, 'variables');
    return this.client.request('/notify/send', { method: 'POST', body: JSON.stringify({
      to: params.to, template_key: params.templateKey, variables, sender_id: params.senderId,
    }) }, options);
  }
  listDeliveries(options?: RequestOptions): Promise<NotifyDelivery[]> { return this.client.request('/notify/deliveries', {}, options); }
}
