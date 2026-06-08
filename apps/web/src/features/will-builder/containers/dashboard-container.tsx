'use client';

import { DashboardList } from '../components/dashboard-list';
import { useWillsList } from '../hooks/use-wills';

export function DashboardContainer() {
  const { data, isLoading } = useWillsList();
  return <DashboardList wills={data ?? []} isLoading={isLoading} />;
}
