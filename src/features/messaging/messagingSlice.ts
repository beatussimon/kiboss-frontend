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
    thread_type?: 'INQUIRY' | 'BOOKING' | 'RIDE' | 'DISPUTE' | 'DIRECT';
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
            error?: string; 
            message?: string;
            code?: string;
          } 
        } 
      };
      // Extract error message from various response formats
      const errorMessage = 
        axiosError.response?.data?.error || 
        axiosError.response?.data?.message ||
        'Failed to create contextual thread';
      return rejectWithValue(errorMessage);
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
      
      const response = await api.post('/messaging/attachments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
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
  async ({ threadId, content, attachments }: { threadId: string; content: string; attachments?: unknown[] }, { rejectWithValue }) => {
    try {
      const response = await api.post<Message>(`/messaging/threads/${threadId}/messages/`, { content, attachments });
      return { threadId, message: response.data };
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          data?: { 
            error?: string; 
            message?: string 
          } 
        } 
      };
      const errorMessage = 
        axiosError.response?.data?.error || 
        axiosError.response?.data?.message ||
        'Failed to send message';
      return rejectWithValue(errorMessage);
    }
  }
);

export const markThreadRead = createAsyncThunk(
  'messaging/markThreadRead',
  async (threadId: string, { rejectWithValue }) => {
    try {
      await api.post(`/messaging/threads/${threadId}/read/`);
      return threadId;
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
    clearCurrentThread: (state) => {
      state.currentThread = null;
      state.messages = [];
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
    addMessage: (state, action: { payload: { threadId: string; message: Message } }) => {
      const { threadId, message } = action.payload;
      const thread = state.threads.find((t) => t.id === threadId);
      if (thread) {
        thread.messages = [...(thread.messages || []), message];
        thread.message_count += 1;
      }
      if (state.currentThread?.id === threadId) {
        state.currentThread.messages = [...(state.currentThread.messages || []), message];
        state.currentThread.message_count += 1;
      }
    },
    appendMessages: (state, action: { payload: Message[] }) => {
      state.messages = [...state.messages, ...action.payload];
    },
    setTyping: (state, action: { payload: { threadId: string; userId: string } }) => {
      // Handle typing indicator
    },
  },
  extraReducers: (builder) => {
    builder
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
        state.unreadCount = (threads as Thread[]).filter((t) => t.status === 'OPEN').reduce((sum, t) => {
          const unread = t.messages?.filter((m) => m.status !== 'READ').length || 0;
          return sum + unread;
        }, 0);
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchThread.fulfilled, (state, action) => {
        state.currentThread = action.payload;
      })
      .addCase(fetchThreadMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages = action.payload.messages;
        state.pagination.hasMore = !!action.payload.next;
      })
      .addCase(fetchThreadMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { threadId, message } = action.payload;
        const thread = state.threads.find((t) => t.id === threadId);
        if (thread) {
          thread.messages = [...(thread.messages || []), message];
          thread.message_count += 1;
        }
        if (state.currentThread?.id === threadId) {
          state.currentThread.messages = [...(state.currentThread.messages || []), message];
          state.currentThread.message_count += 1;
        }
      });
  },
});

export const { clearCurrentThread, clearError, addMessage, appendMessages, setTyping } = messagingSlice.actions;
export default messagingSlice.reducer;
