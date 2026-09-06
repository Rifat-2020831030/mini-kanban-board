'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layout as LayoutIcon, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { isAuthenticated, clearTokens, getRefreshToken } from '@/lib/auth';
import { User } from '@/types/api';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
    enabled: mounted && isAuthenticated(),
  });

  const handleSignOut = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // Ignore errors on logout
    } finally {
      clearTokens();
      router.push('/login');
    }
  };

  if (!mounted || (mounted && !isAuthenticated())) return null;

  return (
    <div className="flex h-screen w-full bg-[#09090b]">
      {/* Sidebar */}
      <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <LayoutIcon className="w-5 h-5 text-zinc-50" />
            <span className="text-zinc-50 font-semibold">Kanban</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          <Link
            href="/boards"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-50 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <LayoutIcon className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">Boards</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span className="text-zinc-400 text-sm">Loading user...</span>
            </div>
          ) : user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-50 text-xs font-medium shrink-0">
                  {user.username?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-zinc-50 text-sm font-medium truncate">{user.username}</span>
                  <span className="text-zinc-400 text-xs truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full py-1.5 px-2 rounded-md border border-zinc-800 text-zinc-400 text-sm hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
