import { KambaClient } from '../client';
import { RequestOptions, VerifyStartParams, VerifyStartResponse, Verification, VerificationDetail,
  VerificationEvent, VerifyStatsParams, VerifyStats } from '../types';
import { validateAngolanPhone, validateSenderId, validateCode, resourceId, requireText } from '../validators';
import { KambaValidationError } from '../errors';

export class VerifyResource {
  constructor(private client: KambaClient) {}
  async start(params: VerifyStartParams, options?: RequestOptions): Promise<VerifyStartResponse> {
    validateAngolanPhone(params.phone);
    if (params.senderId !== undefined) validateSenderId(params.senderId);
    if (params.metadata !== undefined && (!params.metadata || typeof params.metadata !== 'object' || Array.isArray(params.metadata))) {
      throw new KambaValidationError('metadata deve ser um objecto JSON.');
    }
    return this.client.request('/verify/start', { method: 'POST', body: JSON.stringify({
      phone: params.phone, sender_id: params.senderId, locale: params.locale, metadata: params.metadata,
    }) }, options);
  }
  async check(params: { verificationId: string; code: string }, options?: RequestOptions): Promise<{
    success: boolean; verification_id: string; status: 'verified'; verified_at: string;
  }> {
    requireText(params.verificationId, 'verificationId');
    validateCode(params.code);
    return this.client.request('/verify/check', { method: 'POST', body: JSON.stringify({
      verification_id: params.verificationId, code: params.code,
    }) }, options);
  }
  async resend(verificationId: string, options?: RequestOptions): Promise<VerifyStartResponse> {
    requireText(verificationId, 'verificationId');
    return this.client.request('/verify/resend', { method: 'POST', body: JSON.stringify({ verification_id: verificationId }) }, options);
  }
  list(options?: RequestOptions): Promise<Verification[]> { return this.client.request('/verify', {}, options); }
  get(id: string, options?: RequestOptions): Promise<VerificationDetail> {
    return this.client.request(`/verify/${resourceId(id)}`, {}, options);
  }
  events(verificationId?: string, options?: RequestOptions): Promise<VerificationEvent[]> {
    const query = verificationId === undefined ? '' : `?verification_id=${resourceId(verificationId)}`;
    return this.client.request(`/verify/events${query}`, {}, options);
  }
  stats(params: VerifyStatsParams = {}, options?: RequestOptions): Promise<VerifyStats> {
    const query = new URLSearchParams();
    if (params.days !== undefined) query.set('days', String(params.days));
    if (params.environment !== undefined) query.set('environment', params.environment);
    return this.client.request(`/verify/stats${query.size ? `?${query}` : ''}`, {}, options);
  }
}
