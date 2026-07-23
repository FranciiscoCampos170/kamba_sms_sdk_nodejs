import { KambaSMSOptions } from './types';
import { KambaAPIError } from './errors';

export class KambaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: KambaSMSOptions) {
    if (!options.apiKey) {
      throw new Error('A apiKey é obrigatória para inicializar o KambaSMS.');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://nexasms-api.onrender.com'; // Ou o teu domínio de produção
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey, // O teu backend usa flexAuthMiddleware com x-api-key
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        throw new KambaAPIError(
          data.error || 'Erro desconhecido na API KambaSMS',
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof KambaAPIError) throw error;
      throw new KambaAPIError('Erro de rede ao comunicar com a KambaSMS', 500, error);
    }
  }
}