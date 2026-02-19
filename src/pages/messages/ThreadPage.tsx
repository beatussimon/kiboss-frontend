import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchThread, fetchThreadMessages, sendMessage, markThreadRead } from '../../features/messaging/messagingSlice';
import { useChatWebSocket } from '../../features/messaging/useChatWebSocket';
import { getMediaUrl } from '../../utils/media';
import { useState } from 'react';
import { Send, ArrowLeft, Paperclip, Image, FileText, MoreVertical, ShieldAlert } from 'lucide-react';

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentThread: thread, messages, isLoading, isLoadingMessages, pagination, error, typingStatus } = useSelector((state: RootState) => state.messaging);
  const { user } = useSelector((state: RootState) => state.auth);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { sendTyping } = useChatWebSocket(threadId);

  const getOtherParticipant = () => {
    return thread?.participants.find(p => p.id !== user?.id);
  };

  const otherUser = getOtherParticipant();
  const isOtherTyping = !!(threadId && typingStatus[threadId] && otherUser && typingStatus[threadId][otherUser.id]);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThread(threadId));
      dispatch(fetchThreadMessages({ threadId, page: 1 }));
      dispatch(markThreadRead(threadId));
    }
  }, [dispatch, threadId]);

  useEffect(() => {
    if (messages.length > 0 && threadId) {
      // Mark as read whenever new messages arrive and we are in the thread
      dispatch(markThreadRead(threadId));
    }
    scrollToBottom();
  }, [messages, isOtherTyping, threadId, dispatch]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !attachment) return;
    
    if (attachment) {
      const attachments = [attachment];
      await dispatch(sendMessage({ threadId: threadId!, content: message, attachments }));
    } else {
      await dispatch(sendMessage({ threadId: threadId!, content: message }));
    }
    
    setMessage('');
    setAttachment(null);
    sendTyping(false);
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
    if (threadId && pagination.hasMore) {
      dispatch(fetchThreadMessages({ 
        threadId, 
        page: pagination.page + 1 
      }));
    }
  };

  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-2xl mx-auto mt-8 card p-8 text-center">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Conversation unavailable</h2>
        <p className="text-gray-500 mb-6">{error || 'This conversation does not exist or you no longer have access.'}</p>
        <Link to="/messages" className="btn-primary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <Link to="/messages" className="p-2 hover:bg-gray-200 rounded-full transition-colors md:hidden">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm overflow-hidden">
              {otherUser?.profile?.avatar ? (
                <img src={otherUser.profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}</span>
              )}
            </div>
            <div className="ml-3">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown User'}
              </h1>
              <div className="flex items-center">
                <span className={`h-2 w-2 rounded-full mr-2 ${thread.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-xs text-gray-500 capitalize">{thread.thread_type.toLowerCase()}</span>
                {thread.subject && <span className="text-xs text-gray-400 mx-1">•</span>}
                {thread.subject && <span className="text-xs text-gray-500 truncate max-w-[150px]">{thread.subject}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa] custom-scrollbar">
        {pagination.hasMore && (
          <div className="flex justify-center">
            <button 
              onClick={handleLoadMore}
              className="px-4 py-1 text-xs font-medium text-primary-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isLoadingMessages}
            >
              {isLoadingMessages ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}
        
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <div className="bg-white p-4 rounded-full shadow-sm">
              <Send className="h-8 w-8 text-primary-200" />
            </div>
            <p className="text-gray-500 text-sm">No messages yet. Say hi!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const showDate = index === 0 || 
            new Date(msg.created_at).toDateString() !== new Date(messages[index-1].created_at).toDateString();
          
          return (
            <div key={msg.id} className="space-y-2">
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-gray-200/50 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isCurrentUser(msg.sender.id) ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative max-w-[85%] md:max-w-[70%] ${
                  isCurrentUser(msg.sender.id) ? 'order-1' : 'order-2'
                }`}>
                  <div className={`p-3 rounded-2xl shadow-sm ${
                    isCurrentUser(msg.sender.id)
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {msg.attachments.map((att) => (
                          <div key={att.id} className="rounded-lg overflow-hidden border border-black/5">
                            {att.file_type === 'IMAGE' ? (
                              <a href={getMediaUrl(att.file)} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={getMediaUrl(att.file)} alt={att.file_name} className="max-h-60 w-full object-cover hover:opacity-90 transition-opacity" />
                              </a>
                            ) : (
                              <a 
                                href={getMediaUrl(att.file)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-2 text-sm ${
                                  isCurrentUser(msg.sender.id) ? 'bg-white/10 text-white' : 'bg-gray-50 text-primary-600'
                                }`}
                              >
                                <div className={`p-2 rounded ${isCurrentUser(msg.sender.id) ? 'bg-white/20' : 'bg-primary-50'}`}>
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="truncate flex-1">
                                  <p className="font-medium truncate">{att.file_name}</p>
                                  <p className="text-[10px] opacity-70">{(att.file_size / 1024).toFixed(1)} KB</p>
                                </div>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`text-[10px] mt-1 flex items-center justify-end space-x-1 ${
                      isCurrentUser(msg.sender.id) ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isCurrentUser(msg.sender.id) && (
                        <span className="ml-1">
                          {msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {attachment && (
          <div className="mb-3 p-2 bg-primary-50 rounded-lg flex items-center justify-between border border-primary-100">
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-primary-600" />
              <span className="text-sm text-primary-700 font-medium truncate max-w-xs">{attachment.name}</span>
            </div>
            <button onClick={() => setAttachment(null)} className="text-primary-600 hover:text-primary-800 p-1">
              <span className="text-lg">&times;</span>
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors text-gray-500">
              <Paperclip className="h-5 w-5" />
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => e.target.files && setAttachment(e.target.files[0])}
              />
            </label>
            <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors text-gray-500">
              <Image className="h-5 w-5" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files && setAttachment(e.target.files[0])}
              />
            </label>
          </div>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={thread?.status === 'LOCKED' ? 'Conversation locked' : 'Type your message...'}
              className="w-full bg-gray-100 border-none rounded-full py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
              disabled={thread?.status === 'LOCKED'}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={(!message.trim() && !attachment) || thread?.status === 'LOCKED'}
            className={`p-2.5 rounded-full shadow-sm transition-all ${
              (!message.trim() && !attachment) || thread?.status === 'LOCKED'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Be respectful. All conversations are monitored for safety.
        </p>
      </div>
    </div>
  );
}
