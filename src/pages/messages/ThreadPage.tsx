import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThread, fetchThreadMessages, sendMessage, markThreadRead } from '../../features/messaging/messagingSlice';
import { useState } from 'react';
import { Send, ArrowLeft, Paperclip, Image, FileText } from 'lucide-react';

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentThread: thread, messages, isLoading, isLoadingMessages, pagination, error } = useSelector((state: RootState) => state.messaging);
  const { user } = useSelector((state: RootState) => state.auth);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThread(threadId));
      dispatch(fetchThreadMessages({ threadId, page: 1 }));
      dispatch(markThreadRead(threadId));
    }
  }, [dispatch, threadId]);

  const handleSend = async () => {
    if (!message.trim() || !threadId) return;
    const attachments = attachment ? [attachment] : undefined;
    await dispatch(sendMessage({ threadId, content: message, attachments }));
    setMessage('');
    setAttachment(null);
    // Refresh messages after sending
    dispatch(fetchThreadMessages({ threadId, page: 1 }));
  };

  const handleLoadMore = () => {
    if (threadId && pagination.hasMore) {
      dispatch(fetchThreadMessages({ 
        threadId, 
        page: pagination.page + 1 
      }));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  if (isLoading) {
    return <div className="animate-pulse card p-8 h-96" />;
  }

  if (!thread) {
    return (
      <div className="card p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Conversation unavailable</h2>
        <p className="text-sm text-gray-500 mb-4">{error || 'This conversation does not exist or you no longer have access.'}</p>
        <Link to="/messages" className="text-primary-600 hover:text-primary-700">
          ← Back to Messages
        </Link>
      </div>
    );
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
        {pagination.hasMore && (
          <button 
            onClick={handleLoadMore}
            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700"
            disabled={isLoadingMessages}
          >
            {isLoadingMessages ? 'Loading...' : 'Load older messages'}
          </button>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${isCurrentUser(msg.sender.id) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${
              isCurrentUser(msg.sender.id)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 space-y-1">
                  {msg.attachments.map((att) => (
                    <a 
                      key={att.id} 
                      href={att.file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm ${
                        isCurrentUser(msg.sender.id) ? 'text-white/80 hover:text-white' : 'text-primary-600 hover:text-primary-700'
                      }`}
                    >
                      {att.file_type === 'IMAGE' ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      {att.file_name}
                    </a>
                  ))}
                </div>
              )}
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${isCurrentUser(msg.sender.id) ? 'text-white/70' : 'text-gray-500'}`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <label className="btn-secondary cursor-pointer">
          <Paperclip className="h-4 w-4" />
          <input 
            type="file" 
            className="hidden" 
            onChange={handleAttachmentChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="input flex-1"
          disabled={thread?.status === 'LOCKED'}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || thread?.status === 'LOCKED'}
          className="btn-primary"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
