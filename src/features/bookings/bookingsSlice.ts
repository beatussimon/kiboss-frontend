import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingFilters, BookingTimelineEvent, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface BookingsState {
  bookings: Booking[];
  currentBooking: Booking | null;
  timeline: BookingTimelineEvent[];
  isLoading: boolean;
  error: string | null;
  count: number;
}

const initialState: BookingsState = {
  bookings: [],
  currentBooking: null,
  timeline: [],
  isLoading: false,
  error: null,
  count: 0,
};

export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (filters: BookingFilters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Booking> | Booking[]>('/bookings/', { params: filters });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchBooking = createAsyncThunk(
  'bookings/fetchBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Booking>(`/bookings/${bookingId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
      return rejectWithValue(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (data: { asset_id: string; start_time: string; end_time: string; quantity: number; payment_method: string; renter_notes?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>('/bookings/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'bookings/confirmPayment',
  async ({ bookingId, paymentIntentId, paymentMethodId }: { bookingId: string; paymentIntentId: string; paymentMethodId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>(`/bookings/${bookingId}/confirm_payment/`, {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to confirm payment');
    }
  }
);

export const acceptContract = createAsyncThunk(
  'bookings/acceptContract',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>(`/bookings/${bookingId}/accept_contract/`, {
        signature: {
          signed_at: new Date().toISOString(),
        },
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to accept contract');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ bookingId, reason }: { bookingId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>(`/bookings/${bookingId}/cancel/`, { reason });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const startBooking = createAsyncThunk(
  'bookings/startBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>(`/bookings/${bookingId}/start/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to start booking');
    }
  }
);

export const completeBooking = createAsyncThunk(
  'bookings/completeBooking',
  async ({ bookingId, data }: { bookingId: string; data: { actual_return_time?: string; notes?: string; asset_condition?: string } }, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>(`/bookings/${bookingId}/complete/`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to complete booking');
    }
  }
);

export const raiseDispute = createAsyncThunk(
  'bookings/raiseDispute',
  async ({ bookingId, data }: { bookingId: string; data: { reason: string; description: string; disputed_amount: string; evidence?: Array<{ type: string; url: string }> } }, { rejectWithValue }) => {
    try {
      const response = await api.post<Booking>(`/bookings/${bookingId}/dispute/`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to raise dispute');
    }
  }
);

export const fetchBookingTimeline = createAsyncThunk(
  'bookings/fetchTimeline',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<BookingTimelineEvent[] | { events: BookingTimelineEvent[] }>(`/bookings/${bookingId}/timeline/`);
      // Handle both array response and { events: [] } response formats
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      return data.events || [];
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch timeline');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
      state.timeline = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const booking = state.bookings.find((b) => b.id === action.payload.id);
      if (booking) {
        booking.status = action.payload.status as Booking['status'];
      }
      if (state.currentBooking?.id === action.payload.id) {
        state.currentBooking.status = action.payload.status as Booking['status'];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (Array.isArray(action.payload)) {
          state.bookings = action.payload;
          state.count = action.payload.length;
        } else {
          state.bookings = action.payload.results;
          state.count = action.payload.count;
        }
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentBooking = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.bookings.unshift(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.bookings[index] = action.payload;
        if (state.currentBooking?.id === action.payload.id) state.currentBooking = action.payload;
      })
      .addCase(acceptContract.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.bookings[index] = action.payload;
        if (state.currentBooking?.id === action.payload.id) state.currentBooking = action.payload;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.bookings[index] = action.payload;
        if (state.currentBooking?.id === action.payload.id) state.currentBooking = action.payload;
      })
      .addCase(startBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.bookings[index] = action.payload;
        if (state.currentBooking?.id === action.payload.id) state.currentBooking = action.payload;
      })
      .addCase(completeBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.bookings[index] = action.payload;
        if (state.currentBooking?.id === action.payload.id) state.currentBooking = action.payload;
      })
      .addCase(raiseDispute.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.bookings[index] = action.payload;
        if (state.currentBooking?.id === action.payload.id) state.currentBooking = action.payload;
      })
      .addCase(fetchBookingTimeline.fulfilled, (state, action) => {
        state.timeline = action.payload;
      });
  },
});

export const { clearCurrentBooking, clearError, updateBookingStatus } = bookingsSlice.actions;
export default bookingsSlice.reducer;
