import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import WebSocketManager from '../../services/WebSocketManager';
import { fetchNotifications } from './notificationsSlice';

/**
 * Request browser notification permission on mount.
 * Then, when a notification arrives via WebSocket, fire a browser push.
 */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string, actionUrl?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `kiboss-${Date.now()}`,
    });

    if (actionUrl) {
      notification.onclick = () => {
        window.focus();
        window.location.href = actionUrl;
        notification.close();
      };
    }
  }
}

export const useNotificationWebSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id;

  useEffect(() => {
    // Request permission on first mount
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!accessToken || !userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `${window.location.hostname}:8000`
      : window.location.host;
    const url = `${protocol}//${host}/ws/notifications/?token=${accessToken}`;

    WebSocketManager.connect('notification', url);

    // Listen for notification messages and fire browser notifications
    const handleNotification = (event: CustomEvent) => {
      const data = event.detail;
      if (data?.type === 'notification' && data?.data) {
        const notif = data.data;
        showBrowserNotification(
          notif.title || 'New notification',
          notif.message || notif.body || '',
          notif.action_url
        );
        // Refetch to update the badge count
        dispatch(fetchNotifications({}));
      }
    };

    window.addEventListener('ws:notification' as any, handleNotification);

    return () => {
      WebSocketManager.disconnect('notification');
      window.removeEventListener('ws:notification' as any, handleNotification);
    };
  }, [accessToken, userId, dispatch]);
};
