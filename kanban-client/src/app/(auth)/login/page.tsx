'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { setTokens } from '@/lib/auth';
import { ErrorResponse } from '@/types/api';
import { AxiosError } from 'axios';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = res.data;
      setTokens(accessToken, refreshToken);
      router.push('/boards');
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error?.message || 'An error occurred during sign in.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-md p-8 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="w-6 h-6 text-zinc-50" />
        <span className="text-zinc-50 font-semibold text-lg">Kanban</span>
      </div>

      <h1 className="text-zinc-50 text-lg font-semibold mb-2">Sign in to your workspace</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-zinc-50 hover:underline">
          Register &rarr;
        </Link>
      </p>

      {registered && (
        <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-md p-3 mb-4">
          Account created! Please sign in.
        </div>
      )}

      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-50 text-sm font-medium" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-50 text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-50 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-50 text-[#09090b] font-medium text-sm rounded-md py-2 flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-50" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
