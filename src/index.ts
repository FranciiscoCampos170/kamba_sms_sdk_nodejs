import { KambaClient } from './client';
import { SmsResource } from './resources/SmsResource';
import { AccountResource } from './resources/AccountResource';
import { KambaError, KambaValidationError, KambaAPIError } from './errors';

export class KambaSMS extends KambaClient {
  public readonly sms: SmsResource;
  public readonly account: AccountResource;

  constructor(options: { apiKey: string; baseUrl?: string }) {
    super(options);
    this.sms = new SmsResource(this);
    this.account = new AccountResource(this);
  }
}

// Exportar tipos e erros para o utilizador final
export * from './types';
export { KambaError, KambaValidationError, KambaAPIError };