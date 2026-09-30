import { KambaClient } from '../client';
import { LookupResult, LookupBulkResponse, RequestOptions } from '../types';
import { KambaValidationError } from '../errors';

export class LookupResource {
  constructor(private client: KambaClient) {}
  lookup(phone: string, options?: RequestOptions): Promise<LookupResult> {
    return this.client.request('/lookup', { method: 'POST', body: JSON.stringify({ phone }) }, options);
  }
  async bulk(phones: string[], options?: RequestOptions): Promise<LookupBulkResponse> {
    if (!Array.isArray(phones) || phones.length === 0 || phones.length > 500) {
      throw new KambaValidationError('phones deve conter entre 1 e 500 números.');
    }
    return this.client.request('/lookup/bulk', { method: 'POST', body: JSON.stringify({ phones }) }, options);
  }
}
