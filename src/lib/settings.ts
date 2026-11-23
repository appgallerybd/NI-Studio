import type { ApiSettings } from './types';

const KEY = 'ai-chat-settings-v1';

export const CODING_PROMPT = `You are an expert software engineer pair-programming with a developer.
Rules:
- Put all code in fenced code blocks with a language tag. When the code is a file, add the file path after the language, e.g. \`\`\`tsx src/App.tsx
- Give complete, runnable files. Never shorten code with "..." or "rest of the code" unless asked.
- When asked for a web demo, UI or game, produce ONE self-contained HTML file (inline CSS and JS) so it can be previewed directly.
- Keep explanations short and put them outside code blocks.
- Reply in the same language the user writes in.`;

export const defaultSettings: ApiSettings = {
  baseUrl: 'https://api.anthropic.com',
  apiKey: '',
  format: 'anthropic',
  model: '',
  maxTokens: 8192,
  systemPrompt: CODING_PROMPT,
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
    /* স্টোরেজ বন্ধ থাকলে এড়িয়ে যাবে */
  }
}
