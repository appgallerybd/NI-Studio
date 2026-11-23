import { useState } from 'react';
import Icon from './Icon';
import { CODING_PROMPT } from '../lib/settings';
import type { ApiFormat, ApiSettings } from '../lib/types';

interface Props {
  initial: ApiSettings;
  onSave: (s: ApiSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ initial, onSave, onClose }: Props) {
  const [d, setD] = useState<ApiSettings>(initial);
  const [show, setShow] = useState(false);

  function set<K extends keyof ApiSettings>(k: K, v: ApiSettings[K]) {
    setD((p) => ({ ...p, [k]: v }));
  }

  function save() {
    const tokens = Number(d.maxTokens);
    onSave({
      ...d,
      baseUrl: d.baseUrl.trim(),
      apiKey: d.apiKey.trim(),
      model: d.model.trim(),
      maxTokens: Number.isFinite(tokens) && tokens > 0 ? Math.floor(tokens) : 8192,
    });
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>সেটিংস</h2>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="modal-body">
          <label>API ধরন</label>
          <div className="seg">
            {(['anthropic', 'openai'] as ApiFormat[]).map((f) => (
              <button key={f} className={d.format === f ? 'on' : ''} onClick={() => set('format', f)}>
                {f === 'anthropic' ? 'Claude (Anthropic)' : 'OpenAI-সামঞ্জস্যপূর্ণ'}
              </button>
            ))}
          </div>
          <small className="muted">
            Gemini-র জন্য “OpenAI-সামঞ্জস্যপূর্ণ” বেছে Base URL দিন:
            https://generativelanguage.googleapis.com/v1beta/openai
          </small>

          <label>Base URL</label>
          <input
            value={d.baseUrl}
            onChange={(e) => set('baseUrl', e.target.value)}
            placeholder="https://api.anthropic.com"
            autoCapitalize="none"
            autoCorrect="off"
          />

          <label>API key</label>
          <div className="row">
            <input
              type={show ? 'text' : 'password'}
              value={d.apiKey}
              onChange={(e) => set('apiKey', e.target.value)}
              placeholder="sk-…"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button className="btn" onClick={() => setShow((s) => !s)}>{show ? 'লুকান' : 'দেখান'}</button>
          </div>
          <small className="muted">key শুধু এই ব্রাউজারে থাকে, কোথাও আপলোড হয় না।</small>

          <label>সর্বোচ্চ আউটপুট টোকেন</label>
          <input
            type="number"
            value={d.maxTokens}
            onChange={(e) => set('maxTokens', Number(e.target.value))}
            min={256}
          />

          <label>
            সিস্টেম প্রম্পট{' '}
            <button className="link-btn" onClick={() => set('systemPrompt', CODING_PROMPT)}>
              কোডিং প্রম্পট বসান
            </button>
          </label>
          <textarea
            rows={7}
            value={d.systemPrompt}
            onChange={(e) => set('systemPrompt', e.target.value)}
          />
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>বাতিল</button>
          <button className="btn primary" onClick={save}>সেভ করুন</button>
        </div>
      </div>
    </div>
  );
}
