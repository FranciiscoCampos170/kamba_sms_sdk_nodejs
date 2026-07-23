import { KambaClient } from '../client';
import { BalanceResponse, Message, MessageHistoryParams } from '../types';

export class AccountResource {
  constructor(private client: KambaClient) {}

  async getBalance(): Promise<BalanceResponse> {
    return this.client.request<BalanceResponse>('/credits/balance', {
      method: 'GET',
    });
  }

  async getHistory(params?: MessageHistoryParams): Promise<Message[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const endpoint = `/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.client.request<Message[]>(endpoint, {
      method: 'GET',
    });
  }
}