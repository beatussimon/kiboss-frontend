import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Ride, SeatAvailability, SeatBooking, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface RidesState {
  rides: Ride[];
  currentRide: Ride | null;
  seatAvailability: SeatAvailability | null;
  myBookings: SeatBooking[];
  myDrives: Ride[];
  isLoading: boolean;
  error: string | null;
  count: number;
}

const initialState: RidesState = {
  rides: [],
  currentRide: null,
  seatAvailability: null,
  myBookings: [],
  myDrives: [],
  isLoading: false,
  error: null,
  count: 0,
};

export const fetchRides = createAsyncThunk(
  'rides/fetchRides',
  async (params: { origin?: string; destination?: string; departure_date?: string; available_seats?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Ride>>('/rides/', { params });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch rides');
    }
  }
);

export const fetchRide = createAsyncThunk(
  'rides/fetchRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Ride>(`/rides/${rideId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch ride');
    }
  }
);

export const fetchSeatAvailability = createAsyncThunk(
  'rides/fetchSeatAvailability',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<SeatAvailability>(`/rides/${rideId}/seats_detail/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch seat availability');
    }
  }
);

export const bookSeat = createAsyncThunk(
  'rides/bookSeat',
  async ({ rideId, data }: { rideId: string; data: { seat_number: number; pickup_stop_id?: string; dropoff_stop_id?: string; passenger_notes?: string; luggage_count?: number; payment_method: string } }, { rejectWithValue }) => {
    try {
      const response = await api.post<SeatBooking>(`/rides/${rideId}/book/`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to book seat');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'rides/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<SeatBooking[]>('/rides/bookings/', { 
        params: { passenger: 'me' } 
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchMyDrives = createAsyncThunk(
  'rides/fetchMyDrives',
  async (params: { status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Ride>>('/rides/', { 
        params: { driver: 'me', ...params } 
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch drives');
    }
  }
);

export const cancelSeatBooking = createAsyncThunk(
  'rides/cancelSeatBooking',
  async ({ rideId, seatBookingId, reason }: { rideId: string; seatBookingId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rides/${rideId}/bookings/${seatBookingId}/cancel/`, { reason });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const createRide = createAsyncThunk(
  'rides/createRide',
  async (data: Partial<Ride>, { rejectWithValue }) => {
    try {
      const response = await api.post<Ride>('/rides/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
      const details = axiosError.response?.data?.details;
      let message = axiosError.response?.data?.message || 'Failed to create ride';
      if (details) {
        message = Object.entries(details).map(([field, errors]) => `${field}: ${errors.join(', ')}`).join('; ');
      }
      return rejectWithValue(message);
    }
  }
);

export const updateRide = createAsyncThunk(
  'rides/updateRide',
  async ({ id, data }: { id: string; data: Partial<Ride> }, { rejectWithValue }) => {
    try {
      const response = await api.patch<Ride>(`/rides/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to update ride');
    }
  }
);

const ridesSlice = createSlice({
  name: 'rides',
  initialState,
  reducers: {
    clearCurrentRide: (state) => {
      state.currentRide = null;
      state.seatAvailability = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rides
      .addCase(fetchRides.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRides.fulfilled, (state, action: PayloadAction<PaginatedResponse<Ride>>) => {
        state.isLoading = false;
        state.rides = action.payload.results || [];
        state.count = action.payload.count || 0;
      })
      .addCase(fetchRides.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.rides = [];
      })
      // Fetch single ride
      .addCase(fetchRide.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRide.fulfilled, (state, action: PayloadAction<Ride>) => {
        state.isLoading = false;
        state.currentRide = action.payload;
      })
      .addCase(fetchRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentRide = null;
      })
      // Fetch seat availability
      .addCase(fetchSeatAvailability.fulfilled, (state, action: PayloadAction<SeatAvailability>) => {
        state.seatAvailability = action.payload;
      })
      // Fetch my bookings
      .addCase(fetchMyBookings.fulfilled, (state, action: PayloadAction<SeatBooking[]>) => {
        state.myBookings = action.payload || [];
      })
      // Fetch my drives
      .addCase(fetchMyDrives.fulfilled, (state, action: PayloadAction<PaginatedResponse<Ride>>) => {
        state.myDrives = action.payload.results || [];
      });
  },
});

export const { clearCurrentRide, clearError } = ridesSlice.actions;
export default ridesSlice.reducer;
