import type { ApiSettings, ChatMsg } from './types';

function cleanBase(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function buildEndpoint(s: ApiSettings): string {
  const base = cleanBase(s.baseUrl);
  const hasVersion = /\/v\d+(beta)?(\/openai)?$/.test(base);
  if (s.format === 'anthropic') {
    return hasVersion ? `${base}/messages` : `${base}/v1/messages`;
  }
  return hasVersion ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
}

function buildRequest(s: ApiSettings, messages: ChatMsg[]) {
  const endpoint = buildEndpoint(s);
  const sys = s.systemPrompt.trim();

  if (s.format === 'anthropic') {
    const body: Record<string, unknown> = {
      model: s.model,
      max_tokens: s.maxTokens,
      stream: true,
      messages,
    };
    if (sys) body.system = sys;
    return {
      endpoint,
      headers: {
        'content-type': 'application/json',
        'x-api-key': s.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      } as Record<string, string>,
      body: JSON.stringify(body),
    };
  }

  const msgs = sys ? [{ role: 'system', content: sys }, ...messages] : messages;
  return {
    endpoint,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${s.apiKey.trim()}`,
    } as Record<string, string>,
    body: JSON.stringify({
      model: s.model,
      max_tokens: s.maxTokens,
      stream: true,
      messages: msgs,
    }),
  };
}

function extractDelta(format: ApiSettings['format'], data: string): string {
  if (data === '[DONE]') return '';
  let json: any;
  try {
    json = JSON.parse(data);
  } catch {
    return '';
  }
  if (json?.error) {
    throw new Error(json.error.message || 'API থেকে এরর এসেছে');
  }
  if (format === 'anthropic') {
    if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
      return json.delta.text ?? '';
    }
    return '';
  }
  return json.choices?.[0]?.delta?.content ?? '';
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  let detail = text;
  try {
    const j = JSON.parse(text);
    detail = j?.error?.message || j?.message || text;
  } catch {
    /* সাধারণ টেক্সট */
  }
  const hint =
    res.status === 401 || res.status === 403
      ? ' (API key ভুল বা অনুমতি নেই)'
      : res.status === 404
      ? ' (Base URL বা মডেলের নাম ভুল হতে পারে)'
      : res.status === 429
      ? ' (লিমিট শেষ বা অনেক বেশি অনুরোধ)'
      : '';
  return `এরর ${res.status}${hint}: ${String(detail).slice(0, 400)}`;
}

export async function streamChat(
  settings: ApiSettings,
  messages: ChatMsg[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('সেটিংসে API key দিন।');
  if (!settings.baseUrl.trim()) throw new Error('সেটিংসে Base URL দিন।');
  if (!settings.model.trim()) throw new Error('সেটিংসে মডেলের নাম দিন।');

  const req = buildRequest(settings, messages);

  let res: Response;
  try {
    res = await fetch(req.endpoint, {
      method: 'POST',
      headers: req.headers,
      body: req.body,
      signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new Error(
      'সংযোগ হয়নি। ইন্টারনেট, Base URL অথবা CORS অনুমতি পরীক্ষা করুন (প্রক্সি হলে সেটিতে CORS চালু থাকতে হবে)।',
    );
  }

  if (!res.ok) throw new Error(await readError(res));
  if (!res.body) throw new Error('সার্ভার কোনো স্ট্রিম পাঠায়নি।');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const delta = extractDelta(settings.format, line.slice(5).trim());
      if (delta) {
        full += delta;
        onDelta(delta);
      }
    }
  }

  const tail = buffer.trim();
  if (tail.startsWith('data:')) {
    const delta = extractDelta(settings.format, tail.slice(5).trim());
    if (delta) {
      full += delta;
      onDelta(delta);
    }
  }

  if (!full) throw new Error('মডেল কোনো উত্তর দেয়নি। মডেলের নাম ও API ধরন ঠিক আছে কিনা দেখুন।');
  return full;
}
