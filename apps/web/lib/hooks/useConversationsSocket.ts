import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEventHandlers } from '@/lib/types/socket';

interface UseConversationsSocketOptions extends SocketEventHandlers {
  enabled?: boolean;
}

export function useConversationsSocket({
  onConversationUpdate,
  onNewConversation,
  onNewMessage,
  enabled = true,
}: UseConversationsSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const handlersRef = useRef({
    onConversationUpdate,
    onNewConversation,
    onNewMessage,
  });

  // Update handlers when they change without causing reconnect
  useEffect(() => {
    handlersRef.current = {
      onConversationUpdate,
      onNewConversation,
      onNewMessage,
    };
  }, [onConversationUpdate, onNewConversation, onNewMessage]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Remove /api/v1 suffix from API URL for WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const SOCKET_URL = apiUrl.replace(/\/api\/v1$/, '');

    const socket = io(`${SOCKET_URL}/conversations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] âœ… Connected to', `${SOCKET_URL}/conversations`, 'Socket ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] âŒ Disconnected:', reason);

      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] ðŸ”„ Attempting to reconnect...');
          socket.connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] âŒ Connection error:', error.message);
    });

    socket.on('conversation-update', (conversation) => {
      console.log('[WebSocket] ðŸ“¥ conversation-update:', conversation);
      handlersRef.current.onConversationUpdate?.(conversation);
    });

    socket.on('new-conversation', (conversation) => {
      console.log('[WebSocket] ðŸ“¥ new-conversation:', conversation);
      handlersRef.current.onNewConversation?.(conversation);
    });

    socket.on('new-message', (message) => {
      console.log('[WebSocket] ðŸ“¥ new-message:', message);
      handlersRef.current.onNewMessage?.(message);
    });

    socketRef.current = socket;

    return socket;
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      // Remove all listeners before disconnecting
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;

    if (!socket) {
      console.warn('[WebSocket] âš ï¸ Cannot join conversation - socket not initialized');
      return;
    }

    if (socket.connected) {
      console.log('[WebSocket] ðŸšª Joining conversation:', conversationId);
      socket.emit('join-conversation', conversationId);
    } else {
      // Wait for connection before joining
      console.log('[WebSocket] â³ Waiting for connection to join:', conversationId);
      const onConnect = () => {
        console.log('[WebSocket] ðŸšª Now joining conversation:', conversationId);
        socket.emit('join-conversation', conversationId);
        socket.off('connect', onConnect);
      };
      socket.once('connect', onConnect);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      console.log('[WebSocket] ðŸšª Leaving conversation:', conversationId);
      socketRef.current.emit('leave-conversation', conversationId);
    }
  }, []);

  useEffect(() => {
    const socket = connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinConversation,
    leaveConversation,
    reconnect: connect,
  };
}

