import { ChatContainer } from '@/features/chat/containers/chat-container';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ willId: string }>;
}) {
  const { willId } = await params;
  return <ChatContainer willId={willId} />;
}
