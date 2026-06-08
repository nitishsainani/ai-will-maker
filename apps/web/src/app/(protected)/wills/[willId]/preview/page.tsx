import { PreviewContainer } from '@/features/preview/containers/preview-container';

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ willId: string }>;
}) {
  const { willId } = await params;
  return <PreviewContainer willId={willId} />;
}
