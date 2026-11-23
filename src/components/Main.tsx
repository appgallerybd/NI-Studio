import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';
import { streamChat } from '../lib/api';
import { fetchModels, type ModelInfo } from '../lib/models';
import { loadSettings, saveSettings } from '../lib/settings';
import type { ApiSettings, Chat, ChatMsg, Message } from '../lib/types';
import type { PreviewData } from '../lib/preview';
import Sidebar from './Sidebar';
import ModelPicker from './ModelPicker';
import Composer from './Composer';
import MessageBubble from './MessageBubble';
import PreviewPanel from './PreviewPanel';
import SettingsModal from './SettingsModal';
import Icon from './Icon';

const toChatMsg = (m: Message): ChatMsg => ({ role: m.role, content: m.content });

const SUGGESTIONS = [
  'একটি সুন্দর কাউন্টডাউন টাইমার বানাও (একটি HTML ফাইলে)',
  'Python-এ একটি CSV ফাইল পড়ে সারাংশ দেখানোর স্ক্রিপ্ট লেখো',
];

export default function Main({ user }: { user: User }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const [settings, setSettings] = useState<ApiSettings>(loadSettings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const setActive = (id: string | null) => {
    activeRef.current = id;
    setActiveId(id);
  };

  const loadChats = useCallback(async () => {
    try {
      setChats(await db.listChats());
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }, []);

  const refreshModels = useCallback(async (s: ApiSettings) => {
    if (!s.apiKey.trim() || !s.baseUrl.trim()) {
      setModels([]);
      setModelsError(null);
      return;
    }
    setModelsLoading(true);
    setModelsError(null);
    try {
      const list = await fetchModels(s);
      setModels(list);
      if (!settingsRef.current.model && list.length > 0) {
        const next = { ...settingsRef.current, model: list[0].id };
        setSettings(next);
        saveSettings(next);
      }
    } catch (e: any) {
      setModelsError(e?.message || String(e));
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    const s = settingsRef.current;
    if (s.apiKey.trim()) refreshModels(s);
    else setShowSettings(true);
  }, [loadChats, refreshModels]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
    if (stickRef.current || near) {
      el.scrollTop = el.scrollHeight;
      stickRef.current = false;
    }
  }, [messages, streamText, loadingChat]);

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    stop();
    setActive(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  async function selectChat(id: string) {
    stop();
    setSidebarOpen(false);
    setError(null);
    setActive(id);
    setMessages([]);
    setLoadingChat(true);
    stickRef.current = true;
    try {
      const msgs = await db.listMessages(id);
      if (activeRef.current === id) setMessages(msgs);
    } catch (e: any) {
      if (activeRef.current === id) setError(e?.message || String(e));
    } finally {
      if (activeRef.current === id) setLoadingChat(false);
    }
  }

  async function generate(chatId: string, history: ChatMsg[]) {
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setStreamText('');
    setError(null);

    let acc = '';
    let lastFlush = 0;
    try {
      await streamChat(
        settingsRef.current,
        history,
        (d) => {
          acc += d;
          const now = Date.now();
          if (now - lastFlush > 60) {
            lastFlush = now;
            setStreamText(acc);
          }
        },
        controller.signal,
      );
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || String(e));
    }

    if (acc.trim()) {
      try {
        const saved = await db.addMessage(chatId, 'assistant', acc);
        if (activeRef.current === chatId) setMessages((m) => [...m, saved]);
        await db.touchChat(chatId);
      } catch (e: any) {
        setError('উত্তর সেভ করা যায়নি: ' + (e?.message || String(e)));
      }
    }

    if (abortRef.current === controller) abortRef.current = null;
    setStreaming(false);
    setStreamText('');
    loadChats();
  }

  async function send(text: string) {
    if (streaming) return;
    setError(null);
    if (!settingsRef.current.apiKey.trim()) {
      setShowSettings(true);
      return;
    }
    stickRef.current = true;
    try {
      let chatId = activeRef.current;
      if (!chatId) {
        const title = text.replace(/\s+/g, ' ').trim().slice(0, 50) || 'নতুন চ্যাট';
        const chat = await db.createChat(title, settingsRef.current.model);
        chatId = chat.id;
        setActive(chat.id);
        setChats((c) => [chat, ...c]);
      }
      const userMsg = await db.addMessage(chatId, 'user', text);
      const base = activeRef.current === chatId ? messages : [];
      const next = [...base, userMsg];
      setMessages(next);
      await generate(chatId, next.map(toChatMsg));
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function regenerate() {
    const chatId = activeRef.current;
    if (streaming || !chatId || messages.length === 0) return;
    stickRef.current = true;
    setError(null);
    try {
      let base = messages;
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        await db.deleteMessage(last.id);
        base = messages.slice(0, -1);
        setMessages(base);
      }
      await generate(chatId, base.map(toChatMsg));
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function rename(c: Chat) {
    const t = window.prompt('চ্যাটের নতুন নাম', c.title);
    if (!t || !t.trim()) return;
    try {
      await db.renameChat(c.id, t.trim());
      setChats((cs) => cs.map((x) => (x.id === c.id ? { ...x, title: t.trim() } : x)));
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function remove(c: Chat) {
    if (!window.confirm('এই চ্যাট মুছে ফেলবেন?')) return;
    try {
      await db.deleteChat(c.id);
      setChats((cs) => cs.filter((x) => x.id !== c.id));
      if (activeRef.current === c.id) newChat();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  function changeModel(id: string) {
    const next = { ...settingsRef.current, model: id };
    setSettings(next);
    saveSettings(next);
  }

  function saveAll(s: ApiSettings) {
    setSettings(s);
    settingsRef.current = s;
    saveSettings(s);
    setShowSettings(false);
    refreshModels(s);
  }

  async function logout() {
    stop();
    await supabase.auth.signOut();
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeId={activeId}
        email={user.email ?? ''}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={newChat}
        onSelect={selectChat}
        onRename={rename}
        onDelete={remove}
        onSettings={() => {
          setSidebarOpen(false);
          setShowSettings(true);
        }}
        onLogout={logout}
      />

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} title="মেনু">
            <Icon name="menu" />
          </button>
          <ModelPicker
            models={models}
            value={settings.model}
            loading={modelsLoading}
            error={modelsError}
            onChange={changeModel}
            onRefresh={() => refreshModels(settingsRef.current)}
          />
          <div className="spacer" />
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="সেটিংস">
            <Icon name="settings" />
          </button>
        </header>

        <div className="scroll" ref={scrollRef}>
          <div className="thread">
            {messages.length === 0 && !streaming && !loadingChat && (
              <div className="welcome">
                <div className="logo big">✦</div>
                <h1>আজ কী বানাবেন?</h1>
                <div className="suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="suggest" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {loadingChat && <div className="muted center pad">লোড হচ্ছে…</div>}

            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                isLast={i === messages.length - 1 && !streaming}
                onPreview={setPreview}
                onRegenerate={regenerate}
              />
            ))}

            {streaming && (
              <MessageBubble role="assistant" content={streamText} streaming onPreview={setPreview} />
            )}

            {error && (
              <div className="error">
                {error}
                {!streaming && lastIsUser && (
                  <button className="link-btn" onClick={regenerate}> আবার চেষ্টা করুন</button>
                )}
              </div>
            )}
          </div>
        </div>

        <Composer streaming={streaming} onSend={send} onStop={stop} />
      </main>

      {preview && <PreviewPanel data={preview} onClose={() => setPreview(null)} />}
      {showSettings && (
        <SettingsModal initial={settings} onSave={saveAll} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
