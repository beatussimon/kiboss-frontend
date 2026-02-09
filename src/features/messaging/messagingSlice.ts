import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Thread, Message, ThreadFilters } from '../../types';
import api from '../../services/api';

interface MessagingState {
  threads: Thread[];
  currentThread: Thread | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagingState = {
  threads: [],
  currentThread: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchThreads = createAsyncThunk(
  'messaging/fetchThreads',
  async (filters: ThreadFilters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<Thread[]>('/messaging/threads/', { params: filters });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
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
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch thread');
    }
  }
);

export const createThread = createAsyncThunk(
  'messaging/createThread',
  async (data: { thread_type: string; subject?: string; asset_id?: string; initial_message?: { content: string } }, { rejectWithValue }) => {
    try {
      const response = await api.post<Thread>('/messaging/threads/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to create thread');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ threadId, content, attachments }: { threadId: string; content: string; attachments?: unknown[] }, { rejectWithValue }) => {
    try {
      const response = await api.post<Message>(`/messaging/threads/${threadId}/messages/`, { content, attachments });
      return { threadId, message: response.data };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to send message');
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
        state.threads = action.payload;
        state.unreadCount = action.payload.filter((t) => t.status === 'OPEN').reduce((sum, t) => {
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
      .addCase(createThread.fulfilled, (state, action) => {
        state.threads.unshift(action.payload);
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

export const { clearCurrentThread, clearError, addMessage, setTyping } = messagingSlice.actions;
export default messagingSlice.reducer;
