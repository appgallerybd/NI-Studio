export type Role = 'user' | 'assistant';
export type ApiFormat = 'anthropic' | 'openai';

export interface Chat {
  id: string;
  title: string;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  format: ApiFormat;
  model: string;
  maxTokens: number;
  systemPrompt: string;
}

export interface ChatMsg {
  role: Role;
  content: string;
}
