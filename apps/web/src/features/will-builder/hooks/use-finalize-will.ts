'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import { invalidateWillWorkspace } from '@/shared/lib/invalidate-will-workspace';

export function useFinalizeWill(willId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.wills.finalize(willId),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKeys.wills.detail(willId), data);
      await invalidateWillWorkspace(queryClient, willId);
    },
  });
}
