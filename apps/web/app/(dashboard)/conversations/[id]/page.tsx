'use client';

import { useParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useChat } from '@/lib/hooks/use-chat';
import { toast } from 'sonner';

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params.id as string;

    const { sendMessage, loadMoreMessages } = useChat({
        conversationId,
        onMessageReceived: (message) => {
            // You can handle real-time updates here
            console.log('New message received:', message);
        },
    });

    const handleSendMessage = async (content: string) => {
        try {
            await sendMessage(content);
        } catch (err) {
            toast.error('Failed to send message');
            throw err;
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ChatInterface
                conversationId={conversationId}
                botName="AI Assistant"
                onSendMessage={handleSendMessage}
                onLoadMore={loadMoreMessages}
            />
        </div>
    );
}
