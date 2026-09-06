'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      router.replace('/boards');
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Prevent flash of content before client-side check
  if (!mounted) return null;

  return null;
}
