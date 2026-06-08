'use client';

import { useRouter } from 'next/navigation';
import { ApiError } from '@/shared/api/errors';
import { RegisterForm } from '../components/register-form';
import { useRegister } from '../hooks/use-register';

export function RegisterContainer() {
  const router = useRouter();
  const register = useRegister();

  return (
    <RegisterForm
      isLoading={register.isPending}
      error={
        register.error instanceof ApiError ? register.error.message : register.error?.message
      }
      onSubmit={(fullName, email, password) => {
        register.mutate(
          { fullName, email, password },
          { onSuccess: () => router.push('/dashboard') },
        );
      }}
    />
  );
}
