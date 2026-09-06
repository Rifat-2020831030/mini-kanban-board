import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="border-b border-zinc-800 p-4">Dashboard Header</header>
      <main className="flex-1 overflow-auto p-4">{children}</main>
    </div>
  );
}
