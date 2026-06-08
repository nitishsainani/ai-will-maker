'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ValidationProfile } from '@/shared/api/types/validation';

export function useValidationReport(willId: string, profile: ValidationProfile = 'finalize') {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.validation(willId, profile),
    queryFn: () => api.validation.getReport(willId, profile),
    enabled: !!willId,
  });
}
