import { KambaValidationError } from './errors';

export function validateAngolanPhone(phone: string): void {
  if (typeof phone !== 'string' || !/^\+244[0-9]{9}$/.test(phone)) {
    throw new KambaValidationError(
      `Número de telefone inválido: '${phone}'. Deve ser +244 seguido de 9 dígitos (ex: +244923456789).`
    );
  }
}

export function validateMessageContent(text: string): void {
  requireText(text, 'text');
  const urlRegex = /https?:\/\/|www\.|\.com\b|\.ao\b|\.net\b|\.org\b|\.co\b|\.io\b/gi;
  if (urlRegex.test(text)) {
    throw new KambaValidationError(
      'Mensagens com links ou URLs não são permitidas. As operadoras angolanas filtram este conteúdo como spam.'
    );
  }

  if (text.length > 160) {
    throw new KambaValidationError(
      `Mensagem demasiado longa (${text.length}/160 caracteres). O limite é de 160 caracteres por SMS.`
    );
  }

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(text)) {
    throw new KambaValidationError(
      'Emojis não são suportados. As operadoras angolanas podem bloquear ou cobrar múltiplos SMS por mensagens com emojis.'
    );
  }
}
export function requireText(value: string, field: string): void {
  if (typeof value !== 'string' || !value.trim()) throw new KambaValidationError(`${field} é obrigatório.`);
}
export function validateSenderId(value: string): void {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9 ]{3,11}$/.test(value)) {
    throw new KambaValidationError('Sender ID deve conter 3-11 letras, números ou espaços.');
  }
}
export function validateCode(code: string): void {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new KambaValidationError('Código deve ter 6 dígitos.');
}
export function telegramPayload(params: { telegramFallback?: boolean; telegramChatId?: string }) {
  if (params.telegramFallback) requireText(params.telegramChatId as string, 'telegramChatId');
  return { telegram_fallback: params.telegramFallback, telegram_chat_id: params.telegramChatId };
}
export function resourceId(id: string): string {
  requireText(id, 'id');
  return encodeURIComponent(id);
}
export function requireObject(value: unknown, field: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new KambaValidationError(`${field} deve ser um objecto JSON.`);
  }
}
export function validateEmail(value: string, field = 'email'): void {
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new KambaValidationError(`${field} inválido.`);
  }
}
export function validateKey(value: string, field: string, max = 80): void {
  if (typeof value !== 'string' || !new RegExp(`^[a-z][a-z0-9_.-]{2,${max - 1}}$`).test(value)) {
    throw new KambaValidationError(`${field} deve começar por uma letra minúscula e conter 3-${max} letras, números, ponto, hífen ou underscore.`);
  }
}
