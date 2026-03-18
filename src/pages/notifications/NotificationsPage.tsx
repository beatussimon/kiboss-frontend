import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../features/notifications/notificationsSlice';
import {
  Bell, Check, CheckCheck, Calendar, Car, CreditCard,
  MessageCircle, Star, Shield, Users, Heart, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

// Map notification categories to icons and colors
const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  BOOKING: { icon: <Calendar className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  RIDE: { icon: <Car className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  PAYMENT: { icon: <CreditCard className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
  MESSAGE: { icon: <MessageCircle className="h-5 w-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  RATING: { icon: <Star className="h-5 w-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  SOCIAL: { icon: <Heart className="h-5 w-5" />, color: 'text-pink-600', bg: 'bg-pink-50' },
  CONTRACT: { icon: <Shield className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SYSTEM: { icon: <Bell className="h-5 w-5" />, color: 'text-gray-600', bg: 'bg-gray-100' },
  FOLLOW: { icon: <Users className="h-5 w-5" />, color: 'text-teal-600', bg: 'bg-teal-50' },
  ENGAGEMENT: { icon: <TrendingUp className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
};

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({}));
  }, [dispatch]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Mark as read
    if (notification.status !== 'READ') {
      await dispatch(markAsRead(notification.id));
    }

    // Navigate to the relevant resource with API pre-check for 404s
    const actionUrl = notification.action_url || (notification.data as any)?.action_url;
    if (actionUrl) {
      const parts = actionUrl.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const entity = parts[0];
        const id = parts[1];
        try {
          const apiModule = await import('../../services/api');
          await apiModule.default.get(`/${entity}/${id}/`);
          navigate(actionUrl);
        } catch (err: any) {
          if (err.response?.status === 404) {
            toast.error('Item no longer available');
          } else {
            navigate(actionUrl);
          }
        }
      } else {
        navigate(actionUrl);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
    toast.success('All notifications marked as read');
  };

  const getConfig = (category: string) => {
    return categoryConfig[category] || categoryConfig.SYSTEM;
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-secondary">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = getConfig(notification.category);
            const hasAction = !!(notification.action_url || (notification.data as any)?.action_url);

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`card p-4 transition-all ${notification.status === 'READ' ? 'opacity-60' : 'border-l-4 border-l-primary-500'
                  } ${hasAction ? 'cursor-pointer hover:shadow-md hover:bg-gray-50' : ''}`}
                role={hasAction ? 'button' : undefined}
                tabIndex={hasAction ? 0 : undefined}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {getRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.status !== 'READ' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(markAsRead(notification.id));
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
