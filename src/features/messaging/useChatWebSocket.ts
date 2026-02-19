import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { addMessage, setTyping, markThreadRead } from './messagingSlice';
import { Message } from '../../types';

export const useChatWebSocket = (threadId: string | undefined) => {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { user } = useSelector((state: RootState) => state.auth);

  const connect = useCallback(() => {
    if (!threadId || !accessToken || isUnmountedRef.current) return;

    // Only close if we are not already connected or connecting
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Clear any existing connection before starting a new one
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
      ? '127.0.0.1:8000' 
      : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/${threadId}/?token=${accessToken}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Chat WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_message':
          if (data.data.sender.id !== user?.id) {
            dispatch(addMessage({ threadId, message: data.data, isMine: false }));
            sendReadReceipt([data.data.id]);
          }
          break;
        case 'typing':
          dispatch(setTyping({ threadId, userId: data.user_id, isTyping: data.is_typing }));
          break;
        case 'read':
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    socket.onclose = (e) => {
      if (!isUnmountedRef.current) {
        console.log('Chat WebSocket closed, reconnecting...', e.reason);
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      }
    };

    socket.onerror = (err) => {
      console.error('Chat WebSocket error', err);
      socket.close();
    };

    socketRef.current = socket;
  }, [threadId, accessToken, dispatch, user?.id]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        message: content
      }));
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping
      }));
    }
  }, []);

  const sendReadReceipt = useCallback((messageIds: string[]) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'read_receipt',
        message_ids: messageIds
      }));
    }
  }, []);

  return { sendMessage, sendTyping, sendReadReceipt };
};
