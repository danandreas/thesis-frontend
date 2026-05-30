import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/hooks/useTheme';

export const metadata: Metadata = {
  title: 'Psychoposition — Sistem Seleksi Kandidat',
  description: 'Sistem Rekomendasi Penempatan Kandidat Karyawan berbasis ML-Enhanced Fuzzy-ELECTRE',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-montserrat antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
