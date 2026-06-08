'use client';

import { useRouter } from 'next/navigation';
import { ApiError } from '@/shared/api/errors';
import { CreateWillForm } from '../components/create-will-form';
import { useCreateWill } from '../hooks/use-create-will';

export function CreateWillContainer() {
  const router = useRouter();
  const createWill = useCreateWill();

  return (
    <CreateWillForm
      isLoading={createWill.isPending}
      error={
        createWill.error instanceof ApiError
          ? createWill.error.message
          : createWill.error?.message
      }
      onSubmit={(data) => {
        createWill.mutate(data, {
          onSuccess: (will) => router.push(`/wills/${will.id}/chat`),
        });
      }}
    />
  );
}
