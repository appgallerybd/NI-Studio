import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Icon from './Icon';

interface Props {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export default function Composer({ streaming, onSend, onStop }: Props) {
  const [text, setText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 260) + 'px';
  }, [text]);

  function submit() {
    const t = text.trim();
    if (!t || streaming) return;
    onSend(t);
    setText('');
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    let add = '';
    for (const f of files) {
      if (f.size > 300_000) {
        alert(`${f.name} অনেক বড় (সর্বোচ্চ ৩০০ KB)।`);
        continue;
      }
      try {
        const t = await f.text();
        const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
        const fence = t.includes('```') ? '````' : '```';
        add += `\n\n${fence}${ext} ${f.name}\n${t}\n${fence}\n`;
      } catch {
        alert(`${f.name} পড়া যায়নি।`);
      }
    }
    if (add) setText((p) => (p + add).trimStart());
  }

  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          placeholder="এখানে লিখুন…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="composer-row">
          <button className="icon-btn" onClick={() => fileRef.current?.click()} title="কোড ফাইল যুক্ত করুন">
            <Icon name="clip" />
          </button>
          <input ref={fileRef} type="file" multiple hidden onChange={onFiles} />
          <div className="spacer" />
          {streaming ? (
            <button className="send-btn" onClick={onStop} title="থামান">
              <Icon name="stop" size={16} />
            </button>
          ) : (
            <button className="send-btn" onClick={submit} disabled={!text.trim()} title="পাঠান">
              <Icon name="send" size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="composer-note">AI ভুল করতে পারে। গুরুত্বপূর্ণ কোড নিজে যাচাই করুন।</div>
    </div>
  );
}
