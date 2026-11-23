import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import Login from './components/Login';
import Main from './components/Main';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const notConfigured = SUPABASE_URL.includes('YOUR-PROJECT') || SUPABASE_ANON_KEY.includes('YOUR-ANON');

  useEffect(() => {
    if (notConfigured) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session);
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [notConfigured]);

  if (notConfigured) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>কনফিগ বাকি</h1>
          <p className="muted">
            <code>src/config.ts</code> ফাইলে আপনার Supabase Project URL ও anon key বসান।
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="login-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) return <Login />;
  return <Main key={session.user.id} user={session.user} />;
}
