import { KambaClient } from '../client';

export class OtpResource {
  constructor(private client: KambaClient) {}

  async send(params: { phone: string }): Promise<{ success: boolean; message: string; expires_in: number }> {
    return this.client.request('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone: params.phone }),
    });
  }

  async verify(params: { phone: string; code: string }): Promise<{ success: boolean; message: string }> {
    return this.client.request('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone: params.phone, code: params.code }),
    });
  }
}