import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

function translate(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'ইমেইল বা পাসওয়ার্ড ভুল।';
  if (/email not confirmed/i.test(msg)) return 'ইমেইল কনফার্ম করা হয়নি।';
  if (/failed to fetch|network/i.test(msg)) return 'নেটওয়ার্ক সমস্যা, Supabase URL ও ইন্টারনেট পরীক্ষা করুন।';
  return msg;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(translate(error.message));
    } catch (err: any) {
      setError(translate(err?.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="logo">✦</div>
        <h1>স্বাগতম</h1>
        <p className="muted">চালিয়ে যেতে লগইন করুন</p>
        <input
          type="email"
          placeholder="ইমেইল"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'অপেক্ষা করুন…' : 'লগইন'}
        </button>
      </form>
    </div>
  );
}
