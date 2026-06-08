'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import { invalidateWillWorkspace } from '@/shared/lib/invalidate-will-workspace';
import type { UpdateWillInput } from '@/shared/api/types/wills';

export function useUpdateWill(willId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateWillInput) => api.wills.update(willId, patch),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKeys.wills.detail(willId), data);
      await invalidateWillWorkspace(queryClient, willId);
    },
  });
}
