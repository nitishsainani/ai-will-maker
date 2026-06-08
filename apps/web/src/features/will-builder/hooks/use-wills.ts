'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';

export function useWillsList() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.wills.list(),
    queryFn: () => api.wills.list(),
  });
}

export function useWill(willId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.wills.detail(willId),
    queryFn: () => api.wills.getById(willId),
    enabled: !!willId,
  });
}
