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

export type JsonObject = Record<string, unknown>;

export interface NotifyTemplateParams { key: string; name: string; body: string }
export interface NotifyTemplate {
  id: string; template_key: string; name: string; body: string; active: boolean;
  variables: string[]; created_at: string; updated_at?: string;
}
export interface NotifyRenderParams { templateKey: string; variables?: JsonObject }
export interface NotifyRenderResponse { text: string; segments: number }
export interface NotifySendParams extends NotifyRenderParams { to: string; senderId?: string }
export interface NotifySendResponse extends SandboxFields {
  success: boolean; message_id: string; status: string; text?: string;
  remaining_balance?: number; environment?: 'live' | 'test';
}
export interface NotifyDelivery {
  id: string; channel: string; destination: string; status: string;
  environment: 'live' | 'test'; created_at: string;
  notification_templates?: { name: string; template_key: string } | null;
}

export type EmailDomainStatus = 'pending' | 'verified' | 'failed';
export interface EmailDomain {
  id: string; domain: string; status: EmailDomainStatus; dns_records?: unknown;
  last_checked_at?: string | null; created_at: string;
}
export interface EmailSubscription {
  plan_name: string; monthly_limit: number; used_count: number; daily_limit?: number;
  max_concurrent_jobs?: number; status: string; period_start?: string; period_end?: string;
  [key: string]: unknown;
}
export interface EmailMessage {
  id: string; environment: 'production' | 'test'; from_address: string; to_address: string;
  subject: string; status: string; error_message?: string | null; created_at: string;
}
export interface EmailTemplate {
  id: string; key: string; name: string; subject: string; html_body?: string | null;
  text_body?: string | null; variables: string[]; active: boolean; created_at: string; updated_at: string;
}
export interface EmailBulkJob {
  id: string; name: string; status: string; total_count: number; sent_count?: number;
  failed_count?: number; suppressed_count?: number; created_at?: string; completed_at?: string | null;
  [key: string]: unknown;
}
export interface EmailOverview {
  subscription: EmailSubscription; domains: EmailDomain[]; messages: EmailMessage[];
  suppressions: { id: string; email: string; reason: string; created_at: string }[];
  templates: EmailTemplate[]; bulk_jobs: EmailBulkJob[];
}
export interface EmailSendParams {
  to: string; domainId: string; fromLocal: string; subject: string; fromName?: string;
  html?: string; text?: string; replyTo?: string;
}
export interface EmailSendResponse { success: boolean; replayed?: boolean; message_id: string; status: string; remaining?: string }
export interface EmailTemplateParams { key: string; name: string; subject: string; html?: string; text?: string }
export interface EmailTemplateUpdateParams extends Partial<EmailTemplateParams> { active?: boolean }
export interface EmailRenderResponse { subject: string; html: string | null; text: string | null; variables: string[] }
export interface EmailBulkRecipient { email: string; variables?: JsonObject }
export interface EmailBulkParams {
  domainId: string; fromLocal: string; recipients: EmailBulkRecipient[]; name?: string;
  fromName?: string; replyTo?: string; templateId?: string; subject?: string; html?: string; text?: string;
}
export interface EmailBulkResponse { success: boolean; replayed?: boolean; job: EmailBulkJob }

export type TransactionChannel = 'sms' | 'email';
export interface TransactionTemplateParams {
  key: string; eventType: string; name: string; channels: TransactionChannel[];
  smsBody?: string; emailSubject?: string; emailHtml?: string; domainId?: string; fromLocal?: string;
}
export interface TransactionTemplate {
  id: string; template_key: string; event_type: string; name: string; channels: TransactionChannel[];
  sms_body?: string | null; email_subject?: string | null; email_html?: string | null;
  email_domain_id?: string | null; email_from_local?: string | null; active: boolean; variables: string[];
  created_at: string; updated_at?: string;
}
export interface TransactionEventParams {
  event: string; templateKey: string; externalReference: string; environment?: 'test' | 'production';
  customer: { phone?: string; email?: string }; data?: JsonObject; channels?: TransactionChannel[];
}
export interface TransactionDelivery { channel: TransactionChannel; status: string; message_id?: string; simulated?: boolean; error?: string }
export interface TransactionEventResponse {
  id: string; event_type: string; external_reference: string; environment: 'test' | 'production';
  created_at: string; status: 'completed' | 'partial' | 'failed'; deliveries: TransactionDelivery[];
}
export interface TransactionsOverview {
  templates: TransactionTemplate[]; events: JsonObject[];
  metrics: { events: number; failed_deliveries: number };
}
