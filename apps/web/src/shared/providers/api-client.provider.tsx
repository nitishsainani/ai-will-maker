'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ApiClient } from '@/shared/api/api-client.interface';
import { NestApiClient } from '@/shared/api/nest-api-client';
import { SessionStorageTokenStore } from '@/shared/api/token-store';

const ApiClientContext = createContext<ApiClient | null>(null);

const tokenStore = new SessionStorageTokenStore();

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new NestApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
        tokenStore,
      }),
    [],
  );

  return (
    <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
  );
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return client;
}

export function getTokenStore() {
  return tokenStore;
}
