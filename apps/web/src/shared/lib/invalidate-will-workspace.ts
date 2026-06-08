import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/** Invalidates all client caches tied to a single will workspace. */
export function invalidateWillWorkspace(queryClient: QueryClient, willId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.wills.detail(willId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.preview(willId) }),
    queryClient.invalidateQueries({ queryKey: ['validation', willId] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.interview.status(willId) }),
  ]);
}
