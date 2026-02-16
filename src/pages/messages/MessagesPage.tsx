import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThreads } from '../../features/messaging/messagingSlice';
import { MessageCircle, Search, User, Calendar, Car, Home } from 'lucide-react';
import { User as UserType } from '../../types';

export default function MessagesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { threads, isLoading } = useSelector((state: RootState) => state.messaging);
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchThreads({}));
  }, [dispatch]);

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      thread.subject?.toLowerCase().includes(searchLower) ||
      thread.thread_type.toLowerCase().includes(searchLower) ||
      thread.participants.some(p => 
        p.email.toLowerCase().includes(searchLower) ||
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchLower)
      )
    );
  });

  // Only show contextual threads (those with booking, ride, or proper thread type)
  const contextualThreads = filteredThreads.filter(thread => 
    thread.thread_type === 'BOOKING' || 
    thread.thread_type === 'RIDE' || 
    thread.thread_type === 'INQUIRY' ||
    thread.thread_type === 'DISPUTE' ||
    thread.booking ||
    thread.ride
  );

  const getOtherParticipant = (participants: UserType[], currentUserId: string) => {
    return participants.find(p => p.id !== currentUserId) || participants[0];
  };

  const getUserDisplayName = (participant: UserType | undefined) => {
    if (!participant) return 'Unknown User';
    const name = `${participant.first_name} ${participant.last_name}`.trim();
    return name || participant.email;
  };

  const getContextIcon = (thread: typeof threads[0]) => {
    if (thread.thread_type === 'BOOKING' || thread.booking) {
      return <Calendar className="h-4 w-4 text-blue-600" />;
    }
    if (thread.thread_type === 'RIDE' || thread.ride) {
      return <Car className="h-4 w-4 text-green-600" />;
    }
    return <Home className="h-4 w-4 text-gray-600" />;
  };

  const getContextLabel = (thread: typeof threads[0]) => {
    if (thread.thread_type === 'BOOKING' || thread.booking) {
      return 'Booking';
    }
    if (thread.thread_type === 'RIDE' || thread.ride) {
      return 'Ride';
    }
    if (thread.thread_type === 'DISPUTE') {
      return 'Dispute';
    }
    return 'Inquiry';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500">
          Continue conversations about your listings and bookings
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : contextualThreads.length > 0 ? (
        <div className="space-y-2">
          {contextualThreads.map((thread) => {
            const otherUser = getOtherParticipant(thread.participants, user?.id || '');
            return (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className="card p-4 hover:shadow-md transition-shadow block"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {otherUser?.profile?.avatar ? (
                      <img 
                        src={otherUser.profile.avatar} 
                        alt={otherUser.first_name} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {getUserDisplayName(otherUser)}
                        </p>
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {getContextIcon(thread)}
                          <span>{getContextLabel(thread)}</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(thread.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {thread.subject || thread.messages?.[0]?.content || 'No messages'}
                    </p>
                    {thread.status === 'LOCKED' && (
                      <span className="text-xs text-red-500">🔒 Locked</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">
            Messages about your listings and bookings will appear here.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Contact a seller from their listing to start a conversation.
          </p>
        </div>
      )}
    </div>
  );
}
