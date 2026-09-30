import { KambaSMSOptions } from './types';
import { VerifyResource } from './resources/VerifyResource';
import { LookupResource } from './resources/LookupResource';
import { KambaClient } from './client';
import { SmsResource } from './resources/SmsResource';
import { AccountResource } from './resources/AccountResource';
import { KambaError, KambaValidationError, KambaAPIError } from './errors';
import { OtpResource } from './resources/OtpResource';

export class KambaSMS extends KambaClient {
  public readonly sms: SmsResource;
  public readonly account: AccountResource;
  public readonly otp: OtpResource;

  public readonly verify: VerifyResource;
  public readonly lookup: LookupResource;

  constructor(options: KambaSMSOptions) {
    super(options);
    this.sms = new SmsResource(this);
    this.account = new AccountResource(this);
    this.otp = new OtpResource(this);
    this.verify = new VerifyResource(this);
    this.lookup = new LookupResource(this);
  }
}

// Exportar tipos e erros para o utilizador final
export * from './types';
export { KambaError, KambaValidationError, KambaAPIError };