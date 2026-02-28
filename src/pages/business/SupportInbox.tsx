import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeadphonesIcon, MessageCircle, User, Clock, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface SupportThread {
    id: string;
    subject: string;
    thread_type: string;
    participants: Array<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    }>;
    latest_message?: {
        content: string;
        created_at: string;
        sender: string;
    };
    unread_count: number;
    message_count: number;
    created_at: string;
    updated_at: string;
}

export default function SupportInbox() {
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSupportThreads();
    }, []);

    const fetchSupportThreads = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/messaging/threads/', {
                params: { thread_type: 'SUPPORT' }
            });
            setThreads(res.data.results || res.data);
        } catch (error) {
            console.error('Failed to fetch support threads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <HeadphonesIcon className="h-5 w-5 text-gray-400" />
                        Support Inbox
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{threads.length} support conversations</p>
                </div>
            </div>

            {threads.length === 0 ? (
                <div className="card p-12 text-center border-dashed border-2 border-gray-200">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No support requests yet</h3>
                    <p className="text-gray-500 text-sm">Customer support messages will appear here when they reach out.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {threads.map(thread => (
                        <Link
                            key={thread.id}
                            to={`/messages/${thread.id}`}
                            className="card p-4 flex items-center gap-4 hover:shadow-lg transition-all group"
                        >
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${thread.unread_count > 0
                                    ? 'bg-primary-100 text-primary-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                <User className="h-6 w-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-sm truncate ${thread.unread_count > 0 ? 'font-black text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {thread.subject || 'Support Request'}
                                    </h4>
                                    {thread.unread_count > 0 && (
                                        <span className="px-1.5 py-0.5 bg-primary-600 text-white text-[9px] font-black rounded-full min-w-[18px] text-center">
                                            {thread.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {thread.latest_message?.content || 'No messages yet'}
                                </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {new Date(thread.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                <p className="text-[9px] text-gray-400 mt-1">{thread.message_count} messages</p>
                            </div>

                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
