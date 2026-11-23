import { useMemo, useState } from 'react';
import Icon from './Icon';
import type { ModelInfo } from '../lib/models';

interface Props {
  models: ModelInfo[];
  value: string;
  loading: boolean;
  error: string | null;
  onChange: (id: string) => void;
  onRefresh: () => void;
}

export default function ModelPicker({ models, value, loading, error, onChange, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return models;
    return models.filter((m) => (m.id + ' ' + m.name).toLowerCase().includes(s));
  }, [models, q]);

  const custom = q.trim() && !models.some((m) => m.id === q.trim());

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQ('');
  }

  return (
    <div className="picker">
      <button className="picker-btn" onClick={() => setOpen((o) => !o)}>
        <span className="picker-label">{value || 'মডেল বাছুন'}</span>
        <Icon name="chevron" size={16} />
      </button>
      {open && (
        <>
          <div className="picker-backdrop" onClick={() => setOpen(false)} />
          <div className="picker-pop">
            <input
              autoFocus
              placeholder="মডেল খুঁজুন বা নাম লিখুন"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="picker-list">
              {loading && <div className="picker-note">তালিকা আনা হচ্ছে…</div>}
              {error && <div className="picker-note err">{error}</div>}
              {custom && (
                <button className="picker-item" onClick={() => pick(q.trim())}>
                  <span>“{q.trim()}” ব্যবহার করুন</span>
                </button>
              )}
              {filtered.map((m) => (
                <button
                  key={m.id}
                  className={'picker-item' + (m.id === value ? ' active' : '')}
                  onClick={() => pick(m.id)}
                >
                  <span>{m.name}</span>
                  {m.name !== m.id && <small>{m.id}</small>}
                </button>
              ))}
              {!loading && !error && models.length === 0 && (
                <div className="picker-note">সেটিংসে Base URL ও API key দিলে মডেল তালিকা আসবে।</div>
              )}
            </div>
            <button className="picker-refresh" onClick={onRefresh}>
              <Icon name="refresh" size={14} /> তালিকা রিফ্রেশ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
