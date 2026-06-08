'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import { buildPreviewSectionsFromWill } from '@/shared/lib/preview-sections';

export function useWillPreview(willId: string) {
  const api = useApiClient();

  const willQuery = useQuery({
    queryKey: queryKeys.wills.detail(willId),
    queryFn: () => api.wills.getById(willId),
    enabled: !!willId,
  });

  const htmlQuery = useQuery({
    queryKey: queryKeys.preview(willId),
    queryFn: async () => {
      if (willQuery.data?.status === 'FINALIZED') {
        try {
          return await api.documents.getHtmlPreview(willId);
        } catch {
          return null;
        }
      }
      return null;
    },
    enabled: !!willId && willQuery.data?.status === 'FINALIZED',
  });

  const sections =
    willQuery.data && !htmlQuery.data
      ? buildPreviewSectionsFromWill(willQuery.data)
      : [];

  return {
    will: willQuery.data,
    html: htmlQuery.data,
    sections,
    isLoading: willQuery.isLoading,
    isFinalized: willQuery.data?.status === 'FINALIZED',
  };
}
