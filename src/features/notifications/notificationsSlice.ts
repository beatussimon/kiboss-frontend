import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Notification, NotificationPreferences } from '../../types';
import api from '../../services/api';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk<
  Notification[],
  { status?: string; category?: string } | undefined,
  { rejectValue: string }
>(
  'notifications/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get<Notification[]>('/notifications/', { params });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      // Return empty array on 404 (endpoint not found) to prevent ErrorBoundary
      if (axiosError.response?.status === 404) {
        return [];
      }
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await api.post(`/notifications/${notificationId}/read/`);
      return notificationId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/notifications/read_all/');
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const fetchPreferences = createAsyncThunk(
  'notifications/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<NotificationPreferences>('/notifications/preferences/');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch preferences');
    }
  }
);

export const updatePreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (data: Partial<NotificationPreferences>, { rejectWithValue }) => {
    try {
      const response = await api.patch<NotificationPreferences>('/notifications/preferences/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to update preferences');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (action.payload.status !== 'READ') {
        state.unreadCount += 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as unknown;
        const notifications = Array.isArray(payload) ? payload : ((payload as { results?: unknown[] })?.results || []);
        state.notifications = notifications;
        state.unreadCount = (notifications as { status?: string }[]).filter((n) => n.status !== 'READ').length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload);
        if (notification && notification.status !== 'READ') {
          notification.status = 'READ';
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.status = 'READ';
        });
        state.unreadCount = 0;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });
  },
});

export const { addNotification, clearError } = notificationsSlice.actions;
export default notificationsSlice.reducer;
