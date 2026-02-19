import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { addNotification } from './notificationsSlice';
import { addMessage } from '../messaging/messagingSlice';

export const useNotificationWebSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<WebSocket | null>(null);
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    let isCancelled = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (isCancelled || !accessToken || !user) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? '127.0.0.1:8000' 
        : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/notifications/?token=${accessToken}`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (isCancelled) {
          socket.close();
          return;
        }
        console.log('Notification WebSocket connected');
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'notification':
            dispatch(addNotification(data.data));
            break;
          case 'new_message':
            // Handle global message updates and unread counts
            dispatch(addMessage({ 
              threadId: data.data.thread, 
              message: data.data, 
              isMine: false 
            }));
            break;
          default:
            console.log('Unknown notification event:', data.type);
        }
      };

      socket.onclose = (e) => {
        if (!isCancelled) {
          console.log('Notification WebSocket closed, reconnecting...', e.reason);
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };

      socket.onerror = (err) => {
        console.error('Notification WebSocket error', err);
        socket.close();
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      const socket = socketRef.current;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [accessToken, user, dispatch]);

  return { socket: socketRef.current };
};
