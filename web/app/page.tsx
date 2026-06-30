'use client';

import { useEffect, useState } from 'react';

// A URL base da API vem do ambiente. No deploy ela muda, então lemos de env
// desde já em vez de hardcodar.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // Polling: busca a contagem a cada 1,5s e atualiza o número exibido.
  useEffect(() => {
    let active = true;

    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_URL}/clicks/count`, { cache: 'no-store' });
        const data = await res.json();
        if (active) setCount(data.count);
      } catch {
        // silencioso: API pode estar subindo ainda
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const registerClick = async () => {
    setSending(true);
    try {
      await fetch(`${API_URL}/clicks`, { method: 'POST' });
    } catch {
      // ignora erro de rede no estudo
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
        Contador de cliques
      </h1>

      <div style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1 }}>
        {count === null ? '…' : count}
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '-1rem' }}>
        Cliques processados
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
        Registrar clique
      </button>

      <p style={{ maxWidth: 420, fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.5 }}>
        O número sobe ~2s após o clique porque um <strong>worker separado</strong>{' '}
        consome o job da fila, espera 2 segundos (simulando trabalho real) e só
        então grava no banco.
      </p>
    </main>
  );
}
