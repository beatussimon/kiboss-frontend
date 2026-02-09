import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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
      const response = await api.get<SeatAvailability>(`/rides/${rideId}/seats/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch seat availability');
    }
  }
);

export const bookSeat = createAsyncThunk(
  'rides/bookSeat',
  async ({ rideId, data }: { rideId: string; data: { seat_number: number; pickup_stop_id: string; dropoff_stop_id: string; passenger_notes?: string; luggage_count?: number; payment_method: string } }, { rejectWithValue }) => {
    try {
      const response = await api.post<Ride>(`/rides/${rideId}/book/`, data);
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
      const response = await api.get<SeatBooking[]>('/rides/my_bookings/');
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
      const response = await api.get<PaginatedResponse<Ride>>('/rides/my_drives/', { params });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch drives');
    }
  }
);

export const cancelSeatBooking = createAsyncThunk(
  'rides/cancelSeatBooking',
  async ({ rideId, seatBookingId, reason }: { rideId: string; seatBookingId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rides/${rideId}/seats/${seatBookingId}/cancel/`, { reason });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to cancel booking');
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
      .addCase(fetchRides.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRides.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rides = action.payload.results;
        state.count = action.payload.count;
      })
      .addCase(fetchRides.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRide.fulfilled, (state, action) => {
        state.currentRide = action.payload;
      })
      .addCase(fetchSeatAvailability.fulfilled, (state, action) => {
        state.seatAvailability = action.payload;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload;
      })
      .addCase(fetchMyDrives.fulfilled, (state, action) => {
        state.myDrives = action.payload.results;
      });
  },
});

export const { clearCurrentRide, clearError } = ridesSlice.actions;
export default ridesSlice.reducer;
