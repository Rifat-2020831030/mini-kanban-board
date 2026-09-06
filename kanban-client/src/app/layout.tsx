import type { Metadata } from 'next';
import { Providers } from '@/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Kanban',
  description: 'A developer focused kanban board',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-[#f4f4f5]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
