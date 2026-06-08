'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getTokenStore } from '@/shared/providers/api-client.provider';

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const hasToken = typeof window !== 'undefined' && !!getTokenStore().getAccessToken();

  useEffect(() => {
    if (!hasToken) {
      router.replace('/login');
      return;
    }
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasToken, isLoading, isAuthenticated, router]);

  if (!hasToken || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-semibold">
            AI Will Maker
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{user?.fullName}</span>
            <button
              type="button"
              className="text-primary underline"
              onClick={() => logout().then(() => router.push('/login'))}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
