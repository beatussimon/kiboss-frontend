import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import WebSocketManager from '../../services/WebSocketManager';

export const useChatWebSocket = (threadId: string | undefined) => {
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id;

  useEffect(() => {
    if (!threadId || !accessToken || !userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
      ? `${window.location.hostname}:8000` 
      : window.location.host;
    const url = `${protocol}//${host}/ws/chat/${threadId}/?token=${accessToken}`;

    WebSocketManager.connect('chat', url, threadId);

    return () => {
      WebSocketManager.disconnect('chat', threadId);
    };
  }, [threadId, accessToken, userId]);

  const sendMessage = useCallback((content: string) => {
    if (threadId) WebSocketManager.sendMessage(threadId, content);
  }, [threadId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (threadId) WebSocketManager.sendTyping(threadId, isTyping);
  }, [threadId]);

  const sendReadReceipt = useCallback((messageIds: string[]) => {
    if (threadId) WebSocketManager.sendReadReceipt(threadId, messageIds);
  }, [threadId]);

  return { sendMessage, sendTyping, sendReadReceipt };
};
