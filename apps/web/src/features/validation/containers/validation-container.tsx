'use client';

import { ValidationPanel } from '../components/validation-panel';
import { useValidationReport } from '../hooks/use-validation-report';

export function ValidationContainer({ willId }: { willId: string }) {
  const { data, isLoading } = useValidationReport(willId, 'finalize');

  return <ValidationPanel report={data} isLoading={isLoading} />;
}
