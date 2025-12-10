'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { useMessagesStore, type Message } from '@/lib/stores/messages-store';

export function useMessages(conversationId: string) {
  // Zustand store selectors
  const messages = useMessagesStore((state) => state.getMessages(conversationId));
  const loading = useMessagesStore((state) => state.isLoading(conversationId));
  const loadingMore = useMessagesStore((state) => state.loadingMore[conversationId] || false);
  const hasMore = useMessagesStore((state) => state.hasMore[conversationId] ?? true);
  const oldestMessageId = useMessagesStore((state) => state.oldestMessageId[conversationId]);

  const setMessages = useMessagesStore((state) => state.setMessages);
  const prependMessages = useMessagesStore((state) => state.prependMessages);
  const setLoading = useMessagesStore((state) => state.setLoading);
  const setLoadingMore = useMessagesStore((state) => state.setLoadingMore);
  const setHasMore = useMessagesStore((state) => state.setHasMore);
  const setOldestMessageId = useMessagesStore((state) => state.setOldestMessageId);

  // Loading states
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const isLoadingOldMessagesRef = useRef(false);
  const lastLoadedOldestIdRef = useRef<string | null>(null);

  // Messages loading functions - avoid dependencies on store functions
  const loadInitialMessages = useCallback(async () => {
    try {
      const store = useMessagesStore.getState();
      store.setLoading(conversationId, true);
      setError(null);

      const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
        params: { limit: 10 }
      });

      const msgs = Array.isArray(response) ? response : response.messages || [];

      // Add conversationId to each message
      const messagesWithConvId = msgs.map((msg: any) => ({
        ...msg,
        conversationId
      }));

      console.log('[LoadInitial] Loaded messages:', {
        count: msgs.length,
        hasMore: msgs.length === 10,
        oldestId: msgs.length > 0 ? msgs[0].id : null
      });

      const freshStore = useMessagesStore.getState();
      freshStore.setMessages(conversationId, messagesWithConvId);
      freshStore.setHasMore(conversationId, msgs.length === 10);

      if (msgs.length > 0) {
        freshStore.setOldestMessageId(conversationId, msgs[0].id);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load conversation');
    } finally {
      const freshStore = useMessagesStore.getState();
      freshStore.setLoading(conversationId, false);
      isInitialLoadRef.current = false;
    }
  }, [conversationId]); // Only depend on conversationId to avoid loops

  const loadMoreMessages = useCallback(async () => {
    const currentState = useMessagesStore.getState();

    console.log('[LoadMore] Triggered:', {
      loadingMore: currentState.loadingMore[conversationId],
      hasMore: currentState.hasMore[conversationId] ?? true,
      oldestMessageId: currentState.oldestMessageId[conversationId]
    });

    if (currentState.loadingMore[conversationId] ||
      !(currentState.hasMore[conversationId] ?? true) ||
      !currentState.oldestMessageId[conversationId]) {
      console.log('[LoadMore] Skipped - conditions not met');
      return;
    }

    // Mark that we're loading old messages
    isLoadingOldMessagesRef.current = true;
    const freshStore = useMessagesStore.getState();
    freshStore.setLoadingMore(conversationId, true);
    const currentOldestId = freshStore.oldestMessageId[conversationId] as string;
    console.log('[LoadMore] Starting load before:', currentOldestId);

    try {
      // Load older messages using 'before' parameter
      const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
        params: {
          limit: 10,
          before: currentOldestId
        }
      });

      const olderMessages = Array.isArray(response) ? response : response.messages || [];
      console.log('[LoadMore] Loaded messages:', olderMessages.length);

      if (olderMessages.length === 0) {
        console.log('[LoadMore] No more messages');
        freshStore.setHasMore(conversationId, false);
        isLoadingOldMessagesRef.current = false;
      } else {
        // Add conversationId to each message
        const messagesWithConvId = olderMessages.map((msg: any) => ({
          ...msg,
          conversationId
        }));

        console.log('[LoadMore] Prepending messages, new oldest:', messagesWithConvId[0].id);

        // Prepend older messages
        const finalStore = useMessagesStore.getState();
        finalStore.prependMessages(conversationId, messagesWithConvId);
        finalStore.setHasMore(conversationId, olderMessages.length === 10);
      }
    } catch (err) {
      console.error('[LoadMore] Error:', err);
      // Error handling is done by the component using this hook
    } finally {
      const finalStore = useMessagesStore.getState();
      finalStore.setLoadingMore(conversationId, false);
      isLoadingOldMessagesRef.current = false;
    }
  }, [conversationId]); // Only depend on conversationId to avoid loops

  // Load initial messages on mount
  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    isLoadingMore: isLoadingOldMessagesRef.current,
    lastLoadedId: lastLoadedOldestIdRef.current,
    loadInitialMessages,
    loadMoreMessages,
    setError
  };
}

