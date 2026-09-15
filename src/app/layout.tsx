import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Data Kartu Tanda Santri', description: 'Formulir data diri dan tanda tangan santri.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
