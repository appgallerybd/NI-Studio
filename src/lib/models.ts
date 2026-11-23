import type { ApiSettings } from './types';

export interface ModelInfo {
  id: string;
  name: string;
}

export async function fetchModels(s: ApiSettings, signal?: AbortSignal): Promise<ModelInfo[]> {
  const base = s.baseUrl.trim().replace(/\/+$/, '');
  if (!base || !s.apiKey.trim()) throw new Error('Base URL ও API key দিন।');
  const hasVersion = /\/v\d+(beta)?(\/openai)?$/.test(base);
  const path = hasVersion ? `${base}/models` : `${base}/v1/models`;

  let url = path;
  let headers: Record<string, string>;
  if (s.format === 'anthropic') {
    url = `${path}?limit=1000`;
    headers = {
      'x-api-key': s.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  } else {
    headers = { authorization: `Bearer ${s.apiKey.trim()}` };
  }

  let res: Response;
  try {
    res = await fetch(url, { headers, signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new Error('মডেল তালিকা আনা যায়নি: সংযোগ বা CORS সমস্যা।');
  }
  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? 'মডেল তালিকা আনা যায়নি: API key ঠিক নয়।'
        : `মডেল তালিকা আনা যায়নি (এরর ${res.status})। মডেলের নাম হাতে লিখেও ব্যবহার করতে পারেন।`,
    );
  }

  const json: any = await res.json().catch(() => null);
  const arr: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
  const out: ModelInfo[] = [];
  for (const m of arr) {
    const raw = String(m?.id ?? m?.name ?? '').trim();
    if (!raw) continue;
    const id = raw.replace(/^models\//, '');
    out.push({ id, name: String(m?.display_name ?? id) });
  }
  return out;
}
