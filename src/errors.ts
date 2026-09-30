export class KambaError extends Error {
  constructor(message: string) { super(message); this.name = 'KambaError'; }
}
export class KambaValidationError extends KambaError {
  constructor(message: string) { super(message); this.name = 'KambaValidationError'; }
}
export class KambaAPIError extends KambaError {
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly retryAfter?: string;
  constructor(message: string, public readonly statusCode: number, public readonly details?: unknown, headers?: Headers) {
    super(message);
    this.name = 'KambaAPIError';
    const code = (details as { code?: unknown } | null)?.code;
    this.code = typeof code === 'string' ? code : undefined;
    this.requestId = headers?.get('x-request-id') ?? undefined;
    this.retryAfter = headers?.get('retry-after') ?? undefined;
  }
}
