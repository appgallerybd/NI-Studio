import type { ApiSettings } from './types';

const KEY = 'ai-chat-settings-v1';

export const defaultSettings: ApiSettings = {
  baseUrl: 'https://api.anthropic.com',
  apiKey: '',
  format: 'anthropic',
  model: 'claude-sonnet-5-5',
  maxTokens: 4096,
  systemPrompt: '',
};

export function loadSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(s: ApiSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* স্টোরেজ বন্ধ থাকলে চুপচাপ এড়িয়ে যাবে */
  }
}
