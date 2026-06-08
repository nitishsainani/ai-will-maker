import { redirect } from 'next/navigation';

export default async function WillIndexPage({
  params,
}: {
  params: Promise<{ willId: string }>;
}) {
  const { willId } = await params;
  redirect(`/wills/${willId}/chat`);
}
