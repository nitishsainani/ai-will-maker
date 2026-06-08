import { ValidationContainer } from '@/features/validation/containers/validation-container';

export default async function ValidationPage({
  params,
}: {
  params: Promise<{ willId: string }>;
}) {
  const { willId } = await params;
  return <ValidationContainer willId={willId} />;
}
