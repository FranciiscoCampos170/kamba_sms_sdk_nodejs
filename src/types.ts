export interface KambaSMSOptions {
  apiKey: string;
  baseUrl?: string;
  /** Tempo máximo por pedido, em milissegundos. Padrão: 30000. */
  timeoutMs?: number;
}
export interface RequestOptions {
  idempotencyKey?: string;
  requestId?: string;
  signal?: AbortSignal;
}
export interface TelegramFallback {
  telegramChatId?: string;
  telegramFallback?: boolean;
}
export interface SendSmsParams extends TelegramFallback { to: string; text: string; senderId?: string }
export interface SendBulkParams { name: string; senderId: string; text: string; recipients: string[] }
export interface ScheduleSmsParams { to: string; text: string; senderId: string; scheduledAt: string | Date }
/** Paginação local sobre os últimos 100 registos disponibilizados pela API. */
export interface MessageHistoryParams { limit?: number; page?: number }
export interface LifecycleEvent { event: string; timestamp: string; [key: string]: unknown }
export interface SandboxFields {
  environment?: 'live' | 'test'; simulated?: boolean; charged_credits?: number;
  webhook?: unknown; test_code?: string;
}
/** HTTP 202: o fornecedor aceitou a operação, mas a reconciliação está pendente. */
export interface PendingResponse {
  success?: never;
  error: string; details?: string; message?: string; message_id?: string;
  verification_id?: string; reservation_id: string; status?: string;
}
export interface SmsSentResponse extends SandboxFields {
  success: true; message_id: string; status: string; to: string; sender_id?: string;
  remaining_balance?: number; segments?: number; timestamp: string;
  channel?: 'sms' | 'telegram'; lifecycle: LifecycleEvent[];
}
export type SendSmsResponse = SmsSentResponse | PendingResponse;
export interface SendBulkResponse { success: boolean; job_id: string; total: number }
export interface ScheduledMessage {
  id: string; sms_to: string; text: string; sender_id: string; scheduled_at: string;
  status: string; created_at: string;
}
export interface ScheduleSmsResponse { success: boolean; scheduled: ScheduledMessage }
export interface BalanceResponse { balance: number | null; environment?: 'test'; unlimited?: boolean }
export interface Message {
  id: string; to: string; text: string; sender_id: string; twilio_sid?: string;
  message_id?: string; status: string; created_at: string; lifecycle: LifecycleEvent[]; type?: string;
}
export interface BulkJob {
  id: string; name: string; sender_id: string; text: string; total: number; sent: number;
  failed: number; status: string; created_at: string; updated_at: string;
}
export interface BulkJobDetail extends BulkJob {
  recipients: { phone: string; status: string; error: string | null; twilio_sid: string | null }[];
}
export interface MessageStats { date: string; label: string; count: number }
export interface OtpSendParams extends TelegramFallback { phone: string; senderId?: string }
export interface OtpVerifyParams { phone: string; code: string }
export interface OtpSentResponse extends SandboxFields {
  success: true; message?: string; expires_in: number; channel?: 'sms' | 'telegram'; status?: string;
}
export type OtpSendResponse = OtpSentResponse | PendingResponse;
export interface SuccessResponse { success: boolean; message?: string }
export interface VerifyStartParams { phone: string; senderId?: string; locale?: string; metadata?: Record<string, unknown> }
export interface VerificationStarted extends SandboxFields {
  success: true; verification_id: string; status: 'pending'; expires_in: number; resend_count?: number;
}
export type VerifyStartResponse = VerificationStarted | PendingResponse;
export interface Verification {
  id: string; phone: string; sender_id: string; status: string; environment: 'live' | 'test';
  attempts: number; max_attempts: number; resend_count: number; expires_at: string;
  verified_at: string | null; created_at: string; metadata: Record<string, unknown>;
}
export interface VerificationDetail extends Verification {
  last_sent_at: string | null; message_id: string | null; failure_reason: string | null;
  updated_at: string; message: Pick<Message, 'twilio_sid' | 'status' | 'sender_id' | 'created_at' | 'lifecycle'> | null;
}
export interface VerificationEvent { id: string; verification_id: string; event: string; data: Record<string, unknown>; created_at: string }
export interface VerifyStatsParams { days?: number; environment?: 'live' | 'test' | 'all' }
export interface VerifyStats {
  period_days: number; environment: string; total: number; submitted: number; delivered: number;
  delivery_failed: number; verified: number; pending: number; expired: number; failed: number;
  resends: number; live: number; test: number; conversion_rate: number; delivery_rate: number;
  average_verification_seconds: number | null;
}
export interface LookupResult {
  input: string; valid: boolean; normalized: string | null; country: 'AO' | null;
  country_calling_code: '+244' | null; prefix: string | null; number_type: 'mobile' | 'unknown';
  likely_operator: string | null; operator_source: 'prefix_allocation' | null;
  operator_realtime: false; reason: string;
}
export interface LookupBulkResponse {
  summary: { total: number; valid: number; invalid: number; duplicates: number };
  results: (LookupResult & { duplicate: boolean })[];
}
export interface UsageOverview {
  period: { start: string; end: string; label: string }; balance: number;
  api_keys: { active: number };
  messages: { total: number; delivered: number; failed: number; delivery_rate: number };
  verify: { total: number; verified: number; test: number; conversion_rate: number };
  notify: { sent: number }; links: { active: number; clicks: number }; chat: { conversations: number };
  webhooks: { active: number; failed: number }; automations: { active: number; runs: number; failed: number };
  messaging_limits: {
    hourly: { used: number; limit: number }; daily: { used: number; limit: number };
    available: number; bulk_recipient_limit: number; worker_batch_size: number;
  };
  sandbox: { usage_date: string; simulations: UsageLimit; verifications: UsageLimit; rotations: UsageLimit; retention_days: number };
}
export interface UsageLimit { used: number; limit: number }
