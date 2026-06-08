'use client';

import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { useAuth } from './use-auth';
import type { LoginInput } from '@/shared/api/types/auth';

export function useLogin() {
  const api = useApiClient();
  const { setSession } = useAuth();

  return useMutation({
    mutationFn: (input: LoginInput) => api.auth.login(input),
    onSuccess: (session) => setSession(session),
  });
}
