'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import type { CreateWillInput } from '@/shared/api/types/wills';

export function useCreateWill() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWillInput) => api.wills.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wills.list() });
    },
  });
}
