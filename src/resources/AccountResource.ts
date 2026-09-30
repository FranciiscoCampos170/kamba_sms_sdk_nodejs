import { KambaClient } from '../client';
import { BalanceResponse, Message, MessageHistoryParams, MessageStats, RequestOptions, UsageOverview } from '../types';
import { KambaValidationError } from '../errors';

export class AccountResource {
  constructor(private client: KambaClient) {}
  getBalance(options?: RequestOptions): Promise<BalanceResponse> {
    return this.client.request('/credits/balance', {}, options);
  }
  async getHistory(params: MessageHistoryParams = {}, options?: RequestOptions): Promise<Message[]> {
    const { limit = 100, page = 1 } = params;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(page) || page < 1) {
      throw new KambaValidationError('limit deve ser 1-100 e page deve ser um inteiro positivo.');
    }
    const messages = await this.client.request<Message[]>('/messages', {}, options);
    return messages.slice((page - 1) * limit, page * limit);
  }
  getStats(options?: RequestOptions): Promise<MessageStats[]> {
    return this.client.request('/messages/stats', {}, options);
  }
  getUsage(options?: RequestOptions): Promise<UsageOverview> {
    return this.client.request('/usage/overview', {}, options);
  }
}
