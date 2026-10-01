import { KambaClient } from '../client';
import { EmailBulkJob, EmailBulkParams, EmailBulkResponse, EmailDomain, EmailOverview, EmailRenderResponse,
  EmailSendParams, EmailSendResponse, EmailTemplate, EmailTemplateParams, EmailTemplateUpdateParams,
  JsonObject, RequestOptions, SuccessResponse } from '../types';
import { requireObject, requireText, resourceId, validateEmail } from '../validators';
import { KambaValidationError } from '../errors';

const localPattern = /^[a-z0-9._+-]{1,64}$/;
const domainPattern = /^(?=.{4,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const templateKeyPattern = /^[a-z0-9_-]{2,60}$/;
function validateContent(subject: string, html?: string, text?: string): void {
  requireText(subject, 'subject');
  if (subject.length > 200) throw new KambaValidationError('subject aceita até 200 caracteres.');
  if (!html && !text) throw new KambaValidationError('Indica html ou text.');
  if (html && html.length > 100000) throw new KambaValidationError('html aceita até 100000 caracteres.');
  if (text && text.length > 50000) throw new KambaValidationError('text aceita até 50000 caracteres.');
}
function validateLocal(value: string): void {
  if (typeof value !== 'string' || !localPattern.test(value)) throw new KambaValidationError('fromLocal inválido.');
}
function validateTemplate(params: EmailTemplateParams): void {
  if (!templateKeyPattern.test(params.key)) throw new KambaValidationError('key deve conter 2-60 letras minúsculas, números, hífen ou underscore.');
  requireText(params.name, 'name'); if (params.name.length > 100) throw new KambaValidationError('name aceita até 100 caracteres.');
  validateContent(params.subject, params.html, params.text);
}

export class EmailResource {
  constructor(private client: KambaClient) {}
  overview(options?: RequestOptions): Promise<EmailOverview> { return this.client.request('/email/overview', {}, options); }
  async createDomain(domain: string, options?: RequestOptions): Promise<EmailDomain> {
    const normalized = domain.trim().toLowerCase();
    if (!domainPattern.test(normalized)) throw new KambaValidationError('domain inválido.');
    return this.client.request('/email/domains', { method: 'POST', body: JSON.stringify({ domain: normalized }) }, options);
  }
  verifyDomain(id: string, options?: RequestOptions): Promise<EmailDomain> {
    return this.client.request(`/email/domains/${resourceId(id)}/verify`, { method: 'POST' }, options);
  }
  deleteDomain(id: string, options?: RequestOptions): Promise<void> {
    return this.client.request(`/email/domains/${resourceId(id)}`, { method: 'DELETE' }, options);
  }
  async send(params: EmailSendParams, options?: RequestOptions): Promise<EmailSendResponse> {
    validateEmail(params.to, 'to'); validateLocal(params.fromLocal); requireText(params.domainId, 'domainId');
    if (params.replyTo) validateEmail(params.replyTo, 'replyTo'); validateContent(params.subject, params.html, params.text);
    return this.client.request('/email/send', { method: 'POST', body: JSON.stringify({
      to: params.to, domain_id: params.domainId, from_local: params.fromLocal, from_name: params.fromName,
      subject: params.subject, html: params.html, text: params.text, reply_to: params.replyTo,
    }) }, options);
  }
  async createTemplate(params: EmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
    validateTemplate(params);
    return this.client.request('/email/templates', { method: 'POST', body: JSON.stringify(params) }, options);
  }
  async updateTemplate(id: string, params: EmailTemplateUpdateParams, options?: RequestOptions): Promise<EmailTemplate> {
    if (!params || typeof params !== 'object' || Array.isArray(params) || !Object.keys(params).length) throw new KambaValidationError('Indica pelo menos um campo para atualizar.');
    if (params.key !== undefined && !templateKeyPattern.test(params.key)) throw new KambaValidationError('key inválida.');
    if (params.name !== undefined) requireText(params.name, 'name');
    if (params.subject !== undefined) { requireText(params.subject, 'subject'); if (params.subject.length > 200) throw new KambaValidationError('subject aceita até 200 caracteres.'); }
    return this.client.request(`/email/templates/${resourceId(id)}`, { method: 'PATCH', body: JSON.stringify(params) }, options);
  }
  deleteTemplate(id: string, options?: RequestOptions): Promise<void> {
    return this.client.request(`/email/templates/${resourceId(id)}`, { method: 'DELETE' }, options);
  }
  async renderTemplate(id: string, variables: JsonObject = {}, options?: RequestOptions): Promise<EmailRenderResponse> {
    requireObject(variables, 'variables');
    return this.client.request(`/email/templates/${resourceId(id)}/render`, { method: 'POST', body: JSON.stringify({ variables }) }, options);
  }
  async sendBulk(params: EmailBulkParams, options?: RequestOptions): Promise<EmailBulkResponse> {
    requireText(params.domainId, 'domainId'); validateLocal(params.fromLocal);
    if (!Array.isArray(params.recipients) || params.recipients.length < 1 || params.recipients.length > 500) throw new KambaValidationError('recipients deve conter 1-500 destinatários.');
    params.recipients.forEach(item => { validateEmail(item.email); if (item.variables !== undefined) requireObject(item.variables, 'variables'); });
    if (params.replyTo) validateEmail(params.replyTo, 'replyTo');
    if (!params.templateId) validateContent(params.subject as string, params.html, params.text);
    return this.client.request('/email/bulk', { method: 'POST', body: JSON.stringify({
      domain_id: params.domainId, template_id: params.templateId, name: params.name, from_local: params.fromLocal,
      from_name: params.fromName, reply_to: params.replyTo, subject: params.subject, html: params.html,
      text: params.text, recipients: params.recipients,
    }) }, options);
  }
  getBulk(id: string, options?: RequestOptions): Promise<EmailBulkJob> {
    return this.client.request(`/email/bulk/${resourceId(id)}`, {}, options);
  }
  cancelBulk(id: string, options?: RequestOptions): Promise<SuccessResponse> {
    return this.client.request(`/email/bulk/${resourceId(id)}/cancel`, { method: 'POST' }, options);
  }
  async sandboxSend(params: { to?: string; subject?: string } = {}, options?: RequestOptions): Promise<JsonObject> {
    if (params.to !== undefined) validateEmail(params.to, 'to');
    return this.client.request('/email/sandbox/send', { method: 'POST', body: JSON.stringify(params) }, options);
  }
}
