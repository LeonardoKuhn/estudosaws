import type { ReactNode } from 'react';

export const metadata = {
  title: 'Deploy Estudo — Contador de cliques',
  description: 'Botão + número, com processamento assíncrono via worker',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
          background: '#0f172a',
          color: '#f8fafc',
        }}
      >
        {children}
      </body>
    </html>
  );
}
