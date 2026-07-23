export interface KambaSMSOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface SendSmsParams {
  to: string;
  text: string;
  senderId?: string;
}

export interface SendBulkParams {
  name: string;
  senderId: string;
  text: string;
  recipients: string[];
}

export interface ScheduleSmsParams {
  to: string;
  text: string;
  senderId: string;
  scheduledAt: string | Date; // ISO string ou objeto Date
}

export interface MessageHistoryParams {
  limit?: number;
  page?: number;
}

// Respostas da API (baseadas no teu backend)
export interface SendSmsResponse {
  success: boolean;
  message_id: string;
  status: string;
  to: string;
  sender_id: string;
  remaining_balance: number;
  segments: number;
  timestamp: string;
}

export interface SendBulkResponse {
  success: boolean;
  job_id: string;
  total: number;
}

export interface ScheduleSmsResponse {
  success: boolean;
  scheduled: any;
}

export interface BalanceResponse {
  balance: number;
}

export interface Message {
  id: string;
  to: string;
  text: string;
  sender_id: string;
  twilio_sid: string;
  status: string;
  created_at: string;
  lifecycle: any[];
}