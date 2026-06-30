'use client';

import { useEffect, useState } from 'react';

// The API base URL comes from the environment. It changes on deploy, so we
// read it from env from the start instead of hardcoding it.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // Real-time updates via Server-Sent Events: the API pushes the new count
  // whenever the worker finishes a job. No polling — a single open connection.
  useEffect(() => {
    const source = new EventSource(`${API_URL}/clicks/stream`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCount(data.count);
      } catch {
        // ignore malformed event
      }
    };
    // EventSource auto-reconnects on its own; just clean up on unmount.
    return () => source.close();
  }, []);

  const registerClick = async () => {
    setSending(true);
    try {
      await fetch(`${API_URL}/clicks`, { method: 'POST' });
    } catch {
      // ignore network errors in this study
    } finally {
      setSending(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
        Click counter
      </h1>

      <div style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1 }}>
        {count === null ? '…' : count}
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '-1rem' }}>
        Processed clicks
      </div>

      <button
        onClick={registerClick}
        disabled={sending}
        style={{
          fontSize: '1.1rem',
          padding: '0.85rem 1.75rem',
          borderRadius: '0.75rem',
          border: 'none',
          cursor: sending ? 'wait' : 'pointer',
          background: '#38bdf8',
          color: '#0f172a',
          fontWeight: 700,
        }}
      >
        Register click
      </button>

      <p style={{ maxWidth: 440, fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.5 }}>
        The number updates in real time: a <strong>separate worker</strong>{' '}
        consumes the job from the queue, waits 2 seconds (simulating real work),
        writes to the database, and the API <strong>pushes</strong> the new count
        to the browser over Server-Sent Events.
      </p>
    </main>
  );
}
