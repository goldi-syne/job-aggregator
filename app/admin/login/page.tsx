'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!response.ok) {
      setError('Invalid admin password');
      return;
    }
    router.replace('/admin/jobs');
    router.refresh();
  }

  return (
    <main className="wrap" style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="eyebrow">Admin</div>
        <h1 style={{ marginBottom: 8 }}>Job Portal Login</h1>
        <p>Sign in to add jobs manually or upload jobs in bulk.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 22 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            required
            style={{ padding: 14, border: '1px solid #d8dde6', borderRadius: 8 }}
          />
          {error && <p style={{ color: '#b42318', margin: 0 }}>{error}</p>}
          <button className="inlineButton" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
