import { KambaClient } from '../client';
import { OtpSendParams, OtpSendResponse, OtpVerifyParams, SuccessResponse, RequestOptions } from '../types';
import { validateAngolanPhone, validateCode, telegramPayload } from '../validators';

export class OtpResource {
  constructor(private client: KambaClient) {}
  async send(params: OtpSendParams, options?: RequestOptions): Promise<OtpSendResponse> {
    validateAngolanPhone(params.phone);
    return this.client.request('/otp/send', { method: 'POST', body: JSON.stringify({
      phone: params.phone, sender_id: params.senderId, ...telegramPayload(params),
    }) }, options);
  }
  async verify(params: OtpVerifyParams, options?: RequestOptions): Promise<SuccessResponse> {
    validateAngolanPhone(params.phone);
    validateCode(params.code);
    return this.client.request('/otp/verify', { method: 'POST', body: JSON.stringify(params) }, options);
  }
}
