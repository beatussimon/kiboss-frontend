import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Ride, SeatAvailability, SeatBooking, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface RidesState {
  rides: Ride[];
  currentRide: Ride | null;
  seatAvailability: SeatAvailability | null;
  myBookings: SeatBooking[];
  rideManifest: SeatBooking[];
  myDrives: Ride[];
  isLoading: boolean;
  error: string | null;
  count: number;
  // Track which ride ID resulted in a 404, to avoid blocking other ride fetches
  notFoundRideId: string | null;
}

const initialState: RidesState = {
  rides: [],
  currentRide: null,
  seatAvailability: null,
  myBookings: [],
  rideManifest: [],
  myDrives: [],
  isLoading: false,
  error: null,
  count: 0,
  notFoundRideId: null,
};

export const fetchRides = createAsyncThunk(
  'rides/fetchRides',
  async (params: { origin?: string; destination?: string; departure_date?: string; available_seats?: number; page?: number; page_size?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Ride>>('/rides/trips/', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rides');
    }
  }
);

export const fetchRideManifest = createAsyncThunk(
  'rides/fetchRideManifest',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<SeatBooking>>('/rides/bookings/', {
        params: { ride: rideId }
      });
      // Return only the results array to the reducer if expected
      return response.data.results || (response.data as any);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ride manifest');
    }
  }
);

export const fetchRide = createAsyncThunk(
  'rides/fetchRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Ride>(`/rides/trips/${rideId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('404_NOT_FOUND');
      }
      return rejectWithValue(error.message || 'Failed to fetch ride');
    }
  },
  {
    // Only block if this ride ID specifically returned 404 before — not globally
    condition: (rideId, { getState }) => {
      const state = getState() as { rides: RidesState };
      if (state.rides.notFoundRideId === rideId) {
        return false;
      }
    }
  }
);

export const fetchSeatAvailability = createAsyncThunk(
  'rides/fetchSeatAvailability',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<SeatAvailability>(`/rides/trips/${rideId}/seats_detail/`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch seat availability');
    }
  },
  {
    // Only block seats_detail if this ride was specifically noted as 404
    condition: (rideId, { getState }) => {
      const state = getState() as { rides: RidesState };
      if (state.rides.notFoundRideId === rideId) {
        return false;
      }
    }
  }
);

export const bookSeat = createAsyncThunk(
  'rides/bookSeat',
  async ({ rideId, data }: { rideId: string; data: { seat_number: number; pickup_stop_id?: string; dropoff_stop_id?: string; passenger_notes?: string; luggage_count?: number; payment_method: string } }, { rejectWithValue }) => {
    try {
      const response = await api.post<SeatBooking>(`/rides/trips/${rideId}/book/`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to book seat');
    }
  }
);

export const bookCargo = createAsyncThunk(
  'rides/bookCargo',
  async (data: { ride_id: string; weight: number; cargo_description?: string; recipient_name?: string; recipient_phone?: string; pickup_stop_id?: string; dropoff_stop_id?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/rides/cargo-bookings/', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to book cargo');
    }
  }
);

export const bulkBookSeats = createAsyncThunk(
  'rides/bulkBookSeats',
  async ({ rideId, data }: { rideId: string; data: { quantity: number; pickup_stop_id?: string; dropoff_stop_id?: string; passenger_notes?: string; luggage_count?: number } }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rides/trips/${rideId}/bulk_book_seats/`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk book seats');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'rides/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<any>('/rides/bookings/', {
        params: { passenger: 'me' }
      });
      return response.data.results || response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchMyDrives = createAsyncThunk(
  'rides/fetchMyDrives',
  async (params: { status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Ride>>('/rides/trips/', {
        params: { driver: 'me', ...params }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch drives');
    }
  }
);

export const cancelSeatBooking = createAsyncThunk(
  'rides/cancelSeatBooking',
  async ({ rideId, seatBookingId, reason }: { rideId: string; seatBookingId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rides/bookings/${seatBookingId}/cancel/`, { reason });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel booking');
    }
  }
);

export const confirmSeatBooking = createAsyncThunk(
  'rides/confirmSeatBooking',
  async ({ seatBookingId }: { seatBookingId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rides/bookings/${seatBookingId}/confirm/`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to confirm booking');
    }
  }
);

export const createRide = createAsyncThunk(
  'rides/createRide',
  async (data: Partial<Ride>, { rejectWithValue }) => {
    try {
      const response = await api.post<Ride>('/rides/trips/', data);
      return response.data;
    } catch (error: any) {
      const details = error.response?.data?.details;
      let message = error.message || 'Failed to create ride';
      if (details) {
        message = Object.entries(details).map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`).join('; ');
      }
      return rejectWithValue(message);
    }
  }
);

export const updateRide = createAsyncThunk(
  'rides/updateRide',
  async ({ id, data }: { id: string; data: Partial<Ride> }, { rejectWithValue }) => {
    try {
      const response = await api.patch<Ride>(`/rides/trips/${id}/`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update ride');
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
      state.error = null;
      state.notFoundRideId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRideError: (state) => {
      state.error = null;
      state.notFoundRideId = null;
    },
    clearRides: (state) => {
      state.rides = [];
      state.count = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rides
      .addCase(fetchRides.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRides.fulfilled, (state, action: any) => {
        state.isLoading = false;
        const page = action.meta.arg?.page || 1;
        if (page > 1) {
          const newRides = action.payload.results || [];
          const existingIds = new Set(state.rides.map(r => r.id));
          state.rides = [...state.rides, ...newRides.filter((r: Ride) => !existingIds.has(r.id))];
        } else {
          state.rides = action.payload.results || [];
        }
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
        state.notFoundRideId = null; // Clear any stale 404 record on success
        state.error = null;
      })
      .addCase(fetchRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        if (action.payload === '404_NOT_FOUND') {
          // Record which ride ID resulted in 404 so only that ride is blocked
          state.notFoundRideId = action.meta.arg as string;
        }
        state.currentRide = null;
      })
      // Fetch seat availability
      .addCase(fetchSeatAvailability.pending, (state) => {
        // Just track we are fetching, but don't clear anything
      })
      .addCase(fetchSeatAvailability.fulfilled, (state, action: PayloadAction<SeatAvailability>) => {
        state.seatAvailability = action.payload;
      })
      .addCase(fetchSeatAvailability.rejected, (state, action) => {
        // Don't crash or loop, just accept that seat availability couldn't load (e.g., 404 for missing ride)
        state.seatAvailability = null;
      })
      // Fetch my bookings
      .addCase(fetchMyBookings.fulfilled, (state, action: PayloadAction<SeatBooking[]>) => {
        state.myBookings = action.payload || [];
      })
      // Fetch ride manifest
      .addCase(fetchRideManifest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRideManifest.fulfilled, (state, action: PayloadAction<SeatBooking[]>) => {
        state.isLoading = false;
        state.rideManifest = action.payload || [];
      })
      .addCase(fetchRideManifest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(confirmSeatBooking.fulfilled, (state, action) => {
        const index = state.rideManifest.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.rideManifest[index] = action.payload;
        }
      })
      .addCase(cancelSeatBooking.fulfilled, (state, action) => {
        const index = state.rideManifest.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.rideManifest[index] = action.payload;
        }
      })
      // Fetch my drives
      .addCase(fetchMyDrives.fulfilled, (state, action: PayloadAction<PaginatedResponse<Ride>>) => {
        state.myDrives = action.payload.results || [];
      });
  },
});

export const { clearCurrentRide, clearError, clearRideError, clearRides } = ridesSlice.actions;
export default ridesSlice.reducer;

