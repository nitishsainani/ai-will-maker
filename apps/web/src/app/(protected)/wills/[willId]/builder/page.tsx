import { WillBuilderContainer } from '@/features/will-builder/containers/will-builder-container';

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ willId: string }>;
}) {
  const { willId } = await params;
  return <WillBuilderContainer willId={willId} />;
}
