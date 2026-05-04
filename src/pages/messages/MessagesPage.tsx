import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThreads } from '../../features/messaging/messagingSlice';
import { getMediaUrl } from '../../utils/media';
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
    thread.thread_type === 'SUPPORT' ||
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
      return <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />;
    }
    if (thread.thread_type === 'RIDE' || thread.ride) {
      return <Car className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    if (thread.thread_type === 'SUPPORT') {
      return <MessageCircle className="h-4 w-4 text-purple-600" />;
    }
    return <Home className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
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
    if (thread.thread_type === 'SUPPORT') {
      return 'Support';
    }
    return 'Inquiry';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Manage your conversations and requests
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 shrink-0">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : contextualThreads.length > 0 ? (
          <div className="space-y-3">
            {contextualThreads.map((thread) => {
              const otherUser = getOtherParticipant(thread.participants, user?.id || '');
              const isUnread = (thread as any).unread_count > 0;
              return (
                <Link
                  key={thread.id}
                  to={`/messages/${thread.id}`}
                  className={`group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:shadow-primary-500/5 transition-all block relative ${
                    isUnread ? 'ring-1 ring-primary-500/20 shadow-lg shadow-primary-500/5' : ''
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform duration-300 shrink-0">
                      {otherUser?.profile?.avatar ? (
                        <img 
                          src={getMediaUrl(otherUser.profile.avatar)} 
                          alt={otherUser.first_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className={`text-gray-900 dark:text-white truncate text-base ${isUnread ? 'font-black' : 'font-bold'}`}>
                            {getUserDisplayName(otherUser)}
                          </p>
                          <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 group-hover:text-primary-600 transition-colors">
                            {getContextIcon(thread)}
                            <span>{getContextLabel(thread)}</span>
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tight shrink-0 ${isUnread ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                          {new Date(thread.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate pr-6 ${isUnread ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                          {thread.subject || thread.messages?.[0]?.content || 'Start a conversation...'}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          {isUnread && (
                            <span className="flex items-center justify-center min-w-[1.5rem] h-6 px-2 bg-primary-600 rounded-lg text-[10px] font-black text-white shadow-lg shadow-primary-500/30">
                              {(thread as any).unread_count}
                            </span>
                          )}
                          {thread.status === 'LOCKED' && (
                            <span className="text-[10px] text-red-500 font-black uppercase bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-800">🔒 Locked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-16 rounded-[2.5rem] text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">No conversations</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
              When you message providers or receive requests, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
