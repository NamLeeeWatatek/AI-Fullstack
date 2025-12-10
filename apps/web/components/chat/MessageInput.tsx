'use client';

import React, { useState } from 'react';
import { TiptapEditor } from '@/components/chat/TiptapEditor';
import { Button } from '@/components/ui/Button';
import { Message } from '@/lib/stores/messages-store';

interface MessageInputProps {
    conversationId: string;
    onSendMessage: (content: string) => Promise<void>;
    senderRole?: 'user' | 'assistant';
    disabled?: boolean;
}

export function MessageInput({
    conversationId,
    onSendMessage,
    senderRole = 'assistant',
    disabled = false
}: MessageInputProps) {
    const [sending, setSending] = useState(false);

    const handleSend = async (content: string) => {
        if (sending) return;

        setSending(true);
        try {
            await onSendMessage(content);
        } catch (error) {
            // Error is handled by parent
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="border-t bg-background shrink-0">
            <div className="p-2">
                <TiptapEditor
                    onSend={handleSend}
                    placeholder="Type your message..."
                    disabled={disabled || sending}
                    className="max-w-full"
                />
            </div>
        </div>
    );
}

