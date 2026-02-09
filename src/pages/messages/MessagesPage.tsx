import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThreads } from '../../features/messaging/messagingSlice';
import { MessageCircle, Search, Plus } from 'lucide-react';

export default function MessagesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { threads, isLoading } = useSelector((state: RootState) => state.messaging);

  useEffect(() => {
    dispatch(fetchThreads({}));
  }, [dispatch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </button>
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
      ) : threads.length > 0 ? (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              to={`/messages/${thread.id}`}
              className="card p-4 hover:shadow-md transition-shadow block"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-gray-900">
                      {thread.subject || thread.thread_type}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {thread.messages?.[0]?.content || 'No messages'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">Start a conversation with a user or asset owner!</p>
        </div>
      )}
    </div>
  );
}
