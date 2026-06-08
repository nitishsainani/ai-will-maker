'use client';

import { useRouter } from 'next/navigation';
import { ApiError } from '@/shared/api/errors';
import { LoginForm } from '../components/login-form';
import { useLogin } from '../hooks/use-login';

export function LoginContainer() {
  const router = useRouter();
  const login = useLogin();

  return (
    <LoginForm
      isLoading={login.isPending}
      error={login.error instanceof ApiError ? login.error.message : login.error?.message}
      onSubmit={(email, password) => {
        login.mutate(
          { email, password },
          { onSuccess: () => router.push('/dashboard') },
        );
      }}
    />
  );
}
