import { KambaValidationError } from './errors';

export function validateAngolanPhone(phone: string): void {
  if (!/^\+244[0-9]{9}$/.test(phone)) {
    throw new KambaValidationError(
      `Número de telefone inválido: '${phone}'. Deve ser +244 seguido de 9 dígitos (ex: +244923456789).`
    );
  }
}

export function validateMessageContent(text: string): void {
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