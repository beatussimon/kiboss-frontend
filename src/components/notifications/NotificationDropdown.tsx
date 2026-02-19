import { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { markAsRead, markAllAsRead, fetchNotifications } from '../../features/notifications/notificationsSlice';
import { Bell, Check, Clock, Info, Shield, MessageCircle, AlertCircle, X } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, isLoading, unreadCount } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({}));
    }
  }, [isOpen, dispatch]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status !== 'READ') {
      await dispatch(markAsRead(notification.id));
    }
    onClose();

    // Navigate based on category/data
    // Assuming data contains relevant IDs
    switch (notification.category) {
      case 'MESSAGE':
        if (notification.data?.thread_id || notification.data?.thread) {
          navigate(`/messages/${notification.data.thread_id || notification.data.thread}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'BOOKING':
        if (notification.data?.booking_id || notification.data?.booking) {
          navigate(`/bookings/${notification.data.booking_id || notification.data.booking}`);
        } else {
          navigate('/bookings');
        }
        break;
      case 'RIDE':
        if (notification.data?.ride_id || notification.data?.ride) {
          navigate(`/rides/${notification.data.ride_id || notification.data.ride}`);
        } else {
          navigate('/rides');
        }
        break;
      case 'PAYMENT':
        navigate('/payments');
        break;
      default:
        navigate('/notifications');
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'MESSAGE': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'BOOKING': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'RIDE': return <Clock className="h-5 w-5 text-green-500" />;
      case 'PAYMENT': return <Shield className="h-5 w-5 text-purple-500" />;
      case 'SYSTEM': return <Info className="h-5 w-5 text-gray-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-100 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={() => dispatch(markAllAsRead())}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Bell className="h-8 w-8 mb-2 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.slice(0, 5).map((notification) => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  notification.status !== 'READ' ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notification.category)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm text-gray-900 ${notification.status !== 'READ' ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {notification.status !== 'READ' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
        <button 
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
}
