import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import WebSocketManager from '../../services/WebSocketManager';

export const useNotificationWebSocket = () => {
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id;

  useEffect(() => {
    if (!accessToken || !userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
      ? `${window.location.hostname}:8000` 
      : window.location.host;
    const url = `${protocol}//${host}/ws/notifications/?token=${accessToken}`;

    WebSocketManager.connect('notification', url);

    return () => {
      WebSocketManager.disconnect('notification');
    };
  }, [accessToken, userId]);
};
