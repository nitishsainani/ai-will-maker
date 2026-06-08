export const queryKeys = {
  wills: {
    all: ['wills'] as const,
    list: () => [...queryKeys.wills.all, 'list'] as const,
    detail: (willId: string) => [...queryKeys.wills.all, willId] as const,
  },
  preview: (willId: string) => ['preview', willId] as const,
  validation: (willId: string, profile: string) =>
    ['validation', willId, profile] as const,
  interview: {
    status: (willId: string) => ['interview', willId, 'status'] as const,
  },
  auth: {
    me: () => ['auth', 'me'] as const,
  },
};
