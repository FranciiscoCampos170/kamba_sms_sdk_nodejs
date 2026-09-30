import { KambaSMSOptions, RequestOptions } from './types';
import { KambaAPIError, KambaValidationError } from './errors';

export class KambaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: KambaSMSOptions) {
    if (!options || typeof options.apiKey !== 'string' || !options.apiKey.trim()) {
      throw new KambaValidationError('A apiKey é obrigatória para inicializar o KambaSMS.');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.kambasms.ao').replace(/\/+$/, '');
    const url = new URL(this.baseUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.search || url.hash || url.username || url.password) {
      throw new KambaValidationError('baseUrl deve ser uma URL HTTP(S) sem credenciais, query ou fragmento.');
    }
    this.timeoutMs = options.timeoutMs ?? 30_000;
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0 || this.timeoutMs > 2_147_483_647) {
      throw new KambaValidationError('timeoutMs deve ser um número positivo até 2147483647.');
    }
  }

  public async request<T>(endpoint: string, options: RequestInit = {}, context: RequestOptions = {}): Promise<T> {
    if (!endpoint.startsWith('/') || endpoint.startsWith('//')) throw new KambaValidationError('Endpoint inválido.');
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('x-api-key', this.apiKey);
    for (const [name, value, max] of [
      ['Idempotency-Key', context.idempotencyKey, 200],
      ['X-Request-Id', context.requestId, 100],
    ] as const) {
      if (value !== undefined) {
        if (typeof value !== 'string' || !new RegExp(`^[A-Za-z0-9._:-]{8,${max}}$`).test(value)) {
          throw new KambaValidationError(`${name} inválido: usa 8-${max} letras, números, ponto, hífen, underscore ou dois-pontos.`);
        }
        headers.set(name, value);
      }
    }
    const controller = new AbortController();
    const signal = context.signal ?? options.signal;
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options, headers, signal: controller.signal, redirect: 'error',
      });
      const raw = await response.text();
      let data: unknown;
      try { data = raw ? JSON.parse(raw) : undefined; }
      catch {
        throw new KambaAPIError('Resposta não JSON da API KambaSMS.', response.status, raw, response.headers);
      }
      if (!response.ok) {
        const body = data as { error?: unknown; message?: unknown } | undefined;
        const message = body?.error ?? body?.message;
        throw new KambaAPIError(typeof message === 'string' ? message : 'Erro na API KambaSMS.', response.status, data, response.headers);
      }
      return data as T;
    } catch (error) {
      if (error instanceof KambaAPIError) throw error;
      throw new KambaAPIError(controller.signal.aborted ? 'Pedido cancelado ou tempo limite excedido.' : 'Erro de rede ao comunicar com a KambaSMS.', 0, error);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
}
