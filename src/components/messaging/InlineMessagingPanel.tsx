import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThreadMessages, sendMessage, markThreadRead } from '../../features/messaging/messagingSlice';
import { useChatWebSocket } from '../../features/messaging/useChatWebSocket';
import { Send, Paperclip, X, Image, FileText, Loader2 } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import { Message, MessageAttachment } from '../../types';

interface InlineMessagingPanelProps {
  /** Thread ID to display */
  threadId: string;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Height of the panel */
  height?: string;
}

export default function InlineMessagingPanel({
  threadId,
  onClose,
  height = '500px',
}: InlineMessagingPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, isLoadingMessages, pagination } = useSelector((state: RootState) => state.messaging);
  const { user } = useSelector((state: RootState) => state.auth);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { typingStatus } = useSelector((state: RootState) => state.messaging);
  const { sendTyping } = useChatWebSocket(threadId);

  // Check if ANY user other than the current user is typing
  const isOtherTyping = threadId && typingStatus[threadId]
    ? Object.entries(typingStatus[threadId]).some(([id, isTyping]) => id !== user?.id && isTyping)
    : false;

  useEffect(() => {
    dispatch(fetchThreadMessages({ threadId, page: 1 }));
    dispatch(markThreadRead(threadId));
  }, [dispatch, threadId]);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    sendTyping(false);
    try {
      await dispatch(sendMessage({ threadId, content: message })).unwrap();
      setMessage('');
      // Refresh messages
      dispatch(fetchThreadMessages({ threadId, page: 1 }));
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.length > 0) {
      sendTyping(true);
    } else {
      sendTyping(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      dispatch(fetchThreadMessages({
        threadId,
        page: pagination.page + 1
      }));
    }
  };

  const isCurrentUser = (senderId: string) => user?.id === senderId;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="flex flex-col border border-gray-200 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Load More Button */}
        {pagination.hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMessages}
            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {isLoadingMessages ? 'Loading...' : 'Load older messages'}
          </button>
        )}

        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser(msg.sender.id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${isCurrentUser(msg.sender.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={getMediaUrl(att.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm truncate ${isCurrentUser(msg.sender.id)
                          ? 'text-white/80 hover:text-white'
                          : 'text-primary-600 hover:text-primary-700'
                          }`}
                      >
                        {att.file_type === 'IMAGE' ? (
                          <Image className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{att.file_name}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Message Content */}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                {/* Timestamp & Status */}
                <div className={`flex items-center gap-2 mt-1 text-[10px] ${isCurrentUser(msg.sender.id) ? 'text-white/70' : 'text-gray-500'
                  }`}>
                  {!isCurrentUser(msg.sender.id) && (
                    <span className="font-bold">{msg.sender.first_name} {msg.sender.last_name}</span>
                  )}
                  <span>{formatTime(msg.created_at)}</span>
                  {isCurrentUser(msg.sender.id) && msg.status === 'READ' && (
                    <span>✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1 w-fit">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        <div className="flex gap-2">
          <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors">
            <Paperclip className="h-5 w-5" />
            <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
          </label>
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
