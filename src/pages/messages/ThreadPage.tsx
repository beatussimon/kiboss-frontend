import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThread, sendMessage, markThreadRead } from '../../features/messaging/messagingSlice';
import { useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentThread: thread, isLoading } = useSelector((state: RootState) => state.messaging);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThread(threadId));
      dispatch(markThreadRead(threadId));
    }
  }, [dispatch, threadId]);

  const handleSend = async () => {
    if (!message.trim() || !threadId) return;
    await dispatch(sendMessage({ threadId, content: message }));
    setMessage('');
  };

  if (isLoading || !thread) {
    return <div className="animate-pulse card p-8 h-96" />;
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center mb-4">
        <Link to="/messages" className="mr-4">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold">{thread.subject || thread.thread_type}</h1>
      </div>

      <div className="flex-1 card overflow-y-auto p-4 space-y-4">
        {thread.messages?.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender.id === 'currentUser' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${
              msg.sender.id === 'currentUser'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.sender.id === 'currentUser' ? 'text-white/70' : 'text-gray-500'}`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="input flex-1"
          disabled={thread.status === 'LOCKED'}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || thread.status === 'LOCKED'}
          className="btn-primary"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
