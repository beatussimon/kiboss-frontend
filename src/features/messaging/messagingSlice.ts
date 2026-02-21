import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Thread, Message, ThreadFilters, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface MessagingState {
  threads: Thread[];
  currentThread: Thread | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  typingStatus: Record<string, Record<string, boolean>>; // threadId -> { userId: isTyping }
  processedMessageIds: string[]; // Keep track of last ~100 processed message IDs for global deduplication
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const initialState: MessagingState = {
  threads: [],
  currentThread: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  error: null,
  typingStatus: {},
  processedMessageIds: [],
  pagination: {
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasMore: false,
  },
};

export const fetchThreads = createAsyncThunk(
  'messaging/fetchThreads',
  async (filters: ThreadFilters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<Thread[]>('/messaging/threads/', { params: filters });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      // Return empty array on 404 (endpoint not found) to prevent ErrorBoundary
      if (axiosError.response?.status === 404) {
        return [];
      }
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch threads');
    }
  }
);

export const fetchThread = createAsyncThunk(
  'messaging/fetchThread',
  async (threadId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Thread>(`/messaging/threads/${threadId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      // Return null on 404 (endpoint not found) to prevent ErrorBoundary
      if (axiosError.response?.status === 404) {
        return null;
      }
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch thread');
    }
  }
);

export const fetchThreadMessages = createAsyncThunk(
  'messaging/fetchThreadMessages',
  async ({ threadId, page = 1, pageSize = 20 }: { threadId: string; page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Message>>(`/messaging/threads/${threadId}/message_list/`, {
        params: { page, page_size: pageSize }
      });
      return { 
        messages: response.data.results, 
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        return { messages: [], count: 0, next: null, previous: null };
      }
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Note: createDirectThread is deprecated. Use createContextualThread instead.
// Free-form messaging is not allowed - all threads must have context.

export const createContextualThread = createAsyncThunk(
  'messaging/createContextualThread',
  async (data: {
    target_user_id: string;
    thread_type?: 'INQUIRY' | 'BOOKING' | 'RIDE' | 'DISPUTE';
    subject?: string;
    listing_id?: string;
    booking_id?: string;
    ride_id?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post<Thread>('/messaging/threads/create_contextual/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          data?: { 
            error?: string | { message?: string; code?: string }; 
            message?: string;
            code?: string;
          } 
        } 
      };
      // Extract error message from various response formats
      // Backend can return: {error: {message: ...}} or {error: ...} or {message: ...}
      const errorData = axiosError.response?.data;
      let errorMessage = 'Failed to create contextual thread';
      
      if (errorData) {
        // Handle custom exception handler format: {error: {message: ..., code: ...}}
        if (typeof errorData.error === 'object' && errorData.error !== null) {
          const nestedError = errorData.error as { message?: string; code?: string };
          errorMessage = nestedError.message || nestedError.code || 'Failed to create contextual thread';
        } else if (typeof errorData.error === 'string') {
          // Handle simple string format: {error: "message"}
          errorMessage = errorData.error;
        } else if (typeof errorData.message === 'string') {
          // Handle message format: {message: "message"}
          errorMessage = errorData.message;
        }
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'messaging/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ count: number }>('/messaging/threads/unread_count/');
      return response.data.count;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  'messaging/uploadAttachment',
  async ({ messageId, file }: { messageId: string; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('message', messageId);
      formData.append('file', file);
      
      // Don't set Content-Type manually - axios will set it with correct boundary
      const response = await api.post('/messaging/attachments/', formData, {
        headers: {
          'Content-Type': null as unknown as string,
        },
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to upload attachment');
    }
  }
);

// Note: createThread is deprecated. Use createContextualThread instead.
// Free-form messaging is not allowed - all threads must have context.

// Removed createThread - not used for contextual messaging
export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ threadId, content, attachments, optimisticId }: { threadId: string; content: string; attachments?: File[], optimisticId?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<Message>(`/messaging/threads/${threadId}/messages/`, { content });
      const message = response.data;

      if (attachments && attachments.length > 0) {
        await Promise.all(
          attachments.map((file) => {
            const formData = new FormData();
            formData.append('message', message.id);
            formData.append('file', file);
            // Don't set Content-Type manually - axios will set it with correct boundary
            return api.post('/messaging/attachments/', formData, {
              headers: {
                'Content-Type': null as unknown as string,
              },
            });
          })
        );
      }

      return { threadId, message };
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          data?: { 
            error?: string | { message?: string; code?: string }; 
            message?: string 
          } 
        } 
      };
      // Extract error message from various response formats
      const errorData = axiosError.response?.data;
      let errorMessage = 'Failed to send message';
      
      if (errorData) {
        // Handle custom exception handler format: {error: {message: ..., code: ...}}
        if (typeof errorData.error === 'object' && errorData.error !== null) {
          const nestedError = errorData.error as { message?: string; code?: string };
          errorMessage = nestedError.message || nestedError.code || 'Failed to send message';
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const markThreadRead = createAsyncThunk(
  'messaging/markThreadRead',
  async (threadId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ count?: number }>(`/messaging/threads/${threadId}/read/`);
      return { threadId, count: response.data.count || 0 };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const reportAbuse = createAsyncThunk(
  'messaging/reportAbuse',
  async ({ threadId, reason, description }: { threadId: string; reason: string; description: string }, { rejectWithValue }) => {
    try {
      await api.post(`/messaging/threads/${threadId}/report/`, { reason, description });
      return threadId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to report');
    }
  }
);

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    clearCurrentThread: (state, action: { payload?: { isSwitching?: boolean } } = {}) => {
      state.currentThread = null;
      state.messages = [];
      
      // If we are just switching threads, we might want to keep processedMessageIds 
      // to avoid double-processing WS events that arrive during the transition.
      if (!action.payload?.isSwitching) {
        state.processedMessageIds = [];
      }
      
      state.pagination = {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasMore: false,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (state, action: { payload: { threadId: string; message: Message; isMine?: boolean } }) => {
      const { threadId, message, isMine } = action.payload;
      
      const thread = state.threads.find((t) => t.id === threadId);
      const inCurrentThread = state.currentThread?.id === threadId;

      // 1. Logic for global unread count (once per message ID)
      if (!state.processedMessageIds.includes(message.id)) {
        state.processedMessageIds.push(message.id);
        if (state.processedMessageIds.length > 100) {
          state.processedMessageIds.shift();
        }

        // Increment global unread count
        if (!isMine && !inCurrentThread) {
          state.unreadCount += 1;
        }

        // Increment thread-specific unread count
        if (thread && !isMine && !inCurrentThread) {
          (thread as any).unread_count = ((thread as any).unread_count || 0) + 1;
        }
      }
      
      // 2. Logic for updating message lists (Idempotent)
      // Update thread list entry if exists
      if (thread) {
        if (!thread.messages) thread.messages = [];
        if (!thread.messages.some(m => m.id === message.id)) {
          thread.messages.push(message);
          thread.message_count = (thread.message_count || 0) + 1;
        }
      }
      
      // Update current thread view if active
      if (inCurrentThread) {
        if (state.currentThread) {
          if (!state.currentThread.messages) state.currentThread.messages = [];
          if (!state.currentThread.messages.some(m => m.id === message.id)) {
            state.currentThread.messages.push(message);
            state.currentThread.message_count = (state.currentThread.message_count || 0) + 1;
          }
        }
        
        if (!state.messages.some(m => m.id === message.id)) {
          state.messages.push(message);
          // Failsafe sort: Use current time as fallback if created_at is somehow missing
          state.messages.sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
            const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
            return timeA - timeB;
          });
        }
      }
    },
    appendMessages: (state, action: { payload: Message[] }) => {
      state.messages = [...state.messages, ...action.payload];
    },
    setTyping: (state, action: { payload: { threadId: string; userId: string; isTyping: boolean } }) => {
      const { threadId, userId, isTyping } = action.payload;
      if (!state.typingStatus[threadId]) {
        state.typingStatus[threadId] = {};
      }
      state.typingStatus[threadId][userId] = isTyping;
    },
    markMessagesRead: (state, action: { payload: { threadId: string; messageIds: string[] } }) => {
      const { threadId, messageIds } = action.payload;
      
      // Update thread messages in list
      const thread = state.threads.find(t => t.id === threadId);
      if (thread && thread.messages) {
        thread.messages.forEach(msg => {
          if (messageIds.includes(msg.id)) {
            msg.status = 'READ';
          }
        });
      }
      
      // Update current thread messages
      if (state.currentThread?.id === threadId && state.currentThread.messages) {
        state.currentThread.messages.forEach(msg => {
          if (messageIds.includes(msg.id)) {
            msg.status = 'READ';
          }
        });
      }
      
      // Update the main messages list
      if (state.currentThread?.id === threadId) {
        state.messages.forEach(msg => {
          if (messageIds.includes(msg.id)) {
            msg.status = 'READ';
          }
        });
      }
    },
    addOptimisticMessage: (state, action: { payload: { threadId: string; message: Message } }) => {
      const { threadId, message } = action.payload;
      const inCurrentThread = state.currentThread?.id === threadId;
      
      if (inCurrentThread) {
        // Ensure optimistic message has a timestamp for sorting
        const msgWithTime = {
          ...message,
          created_at: message.created_at || new Date().toISOString()
        };

        state.messages.push(msgWithTime);
        if (state.currentThread) {
          if (!state.currentThread.messages) state.currentThread.messages = [];
          state.currentThread.messages.push(msgWithTime);
        }
        
        // Robust sort
        state.messages.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
          const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
          return timeA - timeB;
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchThreads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both array and paginated response formats
        const payload = action.payload as unknown;
        const threads = Array.isArray(payload) ? payload : ((payload as { results?: unknown[] })?.results || []);
        state.threads = threads as Thread[];
        // Removed: state.unreadCount = (threads as any[]).reduce((sum, t) => sum + (t.unread_count || 0), 0);
        // We now rely on fetchUnreadCount and real-time updates for global unreadCount accuracy.
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchThread.fulfilled, (state, action) => {
        state.isLoading = false;
        if (!action.payload) return;

        // If loading a DIFFERENT thread, clear existing data immediately to prevent cross-pollination
        if (state.currentThread?.id !== action.payload.id) {
          state.messages = [];
          state.processedMessageIds = [];
        }

        // Set current thread metadata
        state.currentThread = action.payload;
        
        // Use thread detail messages ONLY as an initial fallback
        if (state.messages.length === 0 && action.payload.messages) {
           state.messages = [...action.payload.messages];
        }

        // Register IDs
        action.payload.messages?.forEach((m: Message) => {
          if (!state.processedMessageIds.includes(m.id)) {
            state.processedMessageIds.push(m.id);
          }
        });
      })
      .addCase(fetchThread.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThread.rejected, (state, action) => {
        state.isLoading = false;
        state.currentThread = null;
        state.error = action.payload as string;
      })
      .addCase(fetchThreadMessages.pending, (state) => {
        state.isLoadingMessages = true;
        // Removed: state.messages = [] or similar if it was here. 
        // Keep existing messages during refresh for a seamless experience.
      })
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        
        const { threadId, page = 1 } = action.meta.arg;
        const fetchedMessages = action.payload.messages || [];
        
        // Update pagination state
        state.pagination.page = page;
        state.pagination.hasMore = !!action.payload.next;

        // API returns newest first, so we reverse for chronological display [Oldest -> Newest]
        const chronologicalFetched = [...fetchedMessages].reverse();

        // Register all fetched IDs in processedMessageIds to prevent redundant WS processing
        chronologicalFetched.forEach(m => {
          if (!state.processedMessageIds.includes(m.id)) {
            state.processedMessageIds.push(m.id);
          }
        });
        if (state.processedMessageIds.length > 300) {
          state.processedMessageIds = state.processedMessageIds.slice(-200);
        }
        
        if (page === 1) {
          // Server-Wins Strategy for Page 1 refresh:
          // We trust the server for confirmed messages, but MUST keep local optimistic ones.
          const optimisticMessages = state.messages.filter(m => m.id.startsWith('temp-'));
          
          // Deduplicate: If an optimistic message was confirmed, the server version wins.
          // (Though usually optimisticIds are unique and replaced via sendMessage.fulfilled)
          
          state.messages = [...chronologicalFetched, ...optimisticMessages];
          
          // Final failsafe sort to keep optimistic at bottom and history chronological
          state.messages.sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
            const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
            return timeA - timeB;
          });
        } else {
          // For Page > 1 (loading history), prepend unique older messages
          const existingIds = new Set(state.messages.map(m => m.id));
          const newUniqueMessages = chronologicalFetched.filter(m => !existingIds.has(m.id));
          
          state.messages = [...newUniqueMessages, ...state.messages];
        }
      })
      .addCase(fetchThreadMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { threadId, message } = action.payload;
        const { optimisticId } = action.meta.arg;
        
        const thread = state.threads.find((t) => t.id === threadId);
        const inCurrentThread = state.currentThread?.id === threadId;

        // 1. Remove specific optimistic message from all locations
        if (optimisticId) {
          if (thread && thread.messages) {
            thread.messages = thread.messages.filter(m => m.id !== optimisticId);
          }
          if (inCurrentThread) {
            state.messages = state.messages.filter(m => m.id !== optimisticId);
            if (state.currentThread && state.currentThread.messages) {
              state.currentThread.messages = state.currentThread.messages.filter(m => m.id !== optimisticId);
            }
          }
        }
        
        // 2. Add to processed IDs (idempotent unread count logic not needed for SENT messages)
        if (!state.processedMessageIds.includes(message.id)) {
          state.processedMessageIds.push(message.id);
          if (state.processedMessageIds.length > 100) {
            state.processedMessageIds.shift();
          }
        }
        
        // 3. Update thread list entry (Idempotent)
        if (thread) {
          if (!thread.messages) thread.messages = [];
          if (!thread.messages.some(m => m.id === message.id)) {
            thread.messages.push(message);
            thread.message_count = (thread.message_count || 0) + 1;
          }
        }
        
        // 4. Update current thread view (Idempotent)
        if (inCurrentThread) {
          if (state.currentThread) {
            if (!state.currentThread.messages) state.currentThread.messages = [];
            if (!state.currentThread.messages.some(m => m.id === message.id)) {
              state.currentThread.messages.push(message);
              state.currentThread.message_count = (state.currentThread.message_count || 0) + 1;
            }
          }
          
          if (!state.messages.some(m => m.id === message.id)) {
            state.messages.push(message);
            // Failsafe sort
            state.messages.sort((a, b) => {
              const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
              const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
              return timeA - timeB;
            });
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        const { threadId, optimisticId } = action.meta.arg;
        state.error = action.payload as string;
        
        // Remove the failed optimistic message so it doesn't stay stuck in "sending" state forever
        if (optimisticId) {
          const thread = state.threads.find((t) => t.id === threadId);
          if (thread && thread.messages) {
            thread.messages = thread.messages.filter(m => m.id !== optimisticId);
          }
          if (state.currentThread?.id === threadId) {
            state.messages = state.messages.filter(m => m.id !== optimisticId);
            if (state.currentThread.messages) {
              state.currentThread.messages = state.currentThread.messages.filter(m => m.id !== optimisticId);
            }
          }
        }
      })
      .addCase(createContextualThread.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(markThreadRead.fulfilled, (state, action) => {
        const { threadId, count } = action.payload;
        
        // Decrement global unread count using the backend's returned count
        // This is more reliable than local state, especially if thread not in list
        state.unreadCount = Math.max(0, state.unreadCount - count);
        
        const thread = state.threads.find(t => t.id === threadId);
        if (thread) {
          (thread as any).unread_count = 0;
        }
        
        if (state.currentThread?.id === threadId) {
          (state.currentThread as any).unread_count = 0;
        }
      });
  },
});

export const { clearCurrentThread, clearError, addMessage, appendMessages, setTyping, markMessagesRead, addOptimisticMessage } = messagingSlice.actions;
export default messagingSlice.reducer;
