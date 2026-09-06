'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { SocketProvider } from './SocketProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </QueryProvider>
  );
}
