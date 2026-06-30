import type { ReactNode } from 'react';

export const metadata = {
  title: 'Deploy Study — Click counter',
  description: 'Button + number, with async processing via a separate worker',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
