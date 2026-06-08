'use client';

import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { useAuth } from './use-auth';
import type { RegisterInput } from '@/shared/api/types/auth';

export function useRegister() {
  const api = useApiClient();
  const { setSession } = useAuth();

  return useMutation({
    mutationFn: (input: RegisterInput) => api.auth.register(input),
    onSuccess: (session) => setSession(session),
  });
}
