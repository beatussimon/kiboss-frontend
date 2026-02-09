import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface AdminState {
  stats: {
    total_users: number;
    active_bookings: number;
    revenue: number;
    avg_rating: number;
    total_assets: number;
    total_rides: number;
    completed_transactions: number;
    dispute_rate: number;
    recent_disputes: Array<{
      id: string;
      booking_id: string;
      status: string;
      created_at: string;
    }>;
  };
  users: User[];
  disputes: Dispute[];
  isLoading: boolean;
  error: string | null;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  created_at: string;
}

interface Dispute {
  id: string;
  booking_id: string;
  user_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
  resolved_at: string | null;
}

const initialState: AdminState = {
  stats: {
    total_users: 0,
    active_bookings: 0,
    revenue: 0,
    avg_rating: 0,
    total_assets: 0,
    total_rides: 0,
    completed_transactions: 0,
    dispute_rate: 0,
    recent_disputes: [],
  },
  users: [],
  disputes: [],
  isLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard/stats/');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch stats');
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (params: { page?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/users/', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
    }
  }
);

export const fetchAllDisputes = createAsyncThunk(
  'admin/fetchAllDisputes',
  async (params: { page?: number; status?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/disputes/', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch disputes');
    }
  }
);

export const resolveDispute = createAsyncThunk(
  'admin/resolveDispute',
  async ({ id, resolution, refund_amount }: { id: string; resolution: string; refund_amount?: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/disputes/${id}/resolve/`, {
        resolution,
        refund_amount,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to resolve dispute');
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'admin/toggleUserStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/users/${userId}/toggle_status/`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to toggle user status');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<AdminState['stats']>) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<{ results: User[] }>) => {
        state.users = action.payload.results;
      })
      .addCase(fetchAllDisputes.fulfilled, (state, action: PayloadAction<{ results: Dispute[] }>) => {
        state.disputes = action.payload.results;
      })
      .addCase(resolveDispute.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.disputes.findIndex((d) => d.id === updated.id);
        if (index !== -1) {
          state.disputes[index] = updated;
        }
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.users.findIndex((u) => u.id === updated.id);
        if (index !== -1) {
          state.users[index] = updated;
        }
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
