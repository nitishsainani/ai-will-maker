'use client';

import { ApiClientProvider } from '@/shared/providers/api-client.provider';
import { QueryProvider } from '@/shared/providers/query.provider';
import { AuthProvider } from '@/features/auth/hooks/use-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ApiClientProvider>
        <AuthProvider>{children}</AuthProvider>
      </ApiClientProvider>
    </QueryProvider>
  );
}
