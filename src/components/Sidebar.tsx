import { useMemo, useState } from 'react';
import Icon from './Icon';
import type { Chat } from '../lib/types';

interface Props {
  chats: Chat[];
  activeId: string | null;
  email: string;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (c: Chat) => void;
  onDelete: (c: Chat) => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function Sidebar(p: Props) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? p.chats.filter((c) => c.title.toLowerCase().includes(s)) : p.chats;
  }, [p.chats, q]);

  return (
    <>
      {p.open && <div className="backdrop" onClick={p.onClose} />}
      <aside className={'sidebar' + (p.open ? ' open' : '')}>
        <div className="side-top">
          <div className="brand">✦ AI চ্যাট</div>
          <button className="new-chat" onClick={p.onNew}>
            <Icon name="plus" size={16} /> নতুন চ্যাট
          </button>
          <input className="side-search" placeholder="চ্যাট খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="chat-list">
          {list.length === 0 && <div className="muted pad">কোনো চ্যাট নেই</div>}
          {list.map((c) => (
            <div key={c.id} className={'chat-item' + (c.id === p.activeId ? ' active' : '')}>
              <button className="chat-title" onClick={() => p.onSelect(c.id)} title={c.title}>
                {c.title}
              </button>
              <button className="icon-btn small" onClick={() => p.onRename(c)} title="নাম বদলান">
                <Icon name="edit" size={14} />
              </button>
              <button className="icon-btn small" onClick={() => p.onDelete(c)} title="মুছুন">
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="side-bottom">
          <div className="email" title={p.email}>{p.email}</div>
          <button className="icon-btn" onClick={p.onSettings} title="সেটিংস"><Icon name="settings" /></button>
          <button className="icon-btn" onClick={p.onLogout} title="লগআউট"><Icon name="logout" /></button>
        </div>
      </aside>
    </>
  );
}
