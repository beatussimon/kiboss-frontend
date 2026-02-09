import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Rating, RatingCategory } from '../../types';
import api from '../../services/api';

interface RatingsState {
  ratings: Rating[];
  currentRating: Rating | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RatingsState = {
  ratings: [],
  currentRating: null,
  isLoading: false,
  error: null,
};

export const fetchRatings = createAsyncThunk(
  'ratings/fetchRatings',
  async ({ userId, category }: { userId: string; category?: RatingCategory }, { rejectWithValue }) => {
    try {
      const response = await api.get<Rating[]>(`/ratings/user/${userId}/`, { params: { category } });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch ratings');
    }
  }
);

export const createRating = createAsyncThunk(
  'ratings/createRating',
  async (data: {
    booking_id: string;
    ride_id?: string;
    category: RatingCategory;
    overall_rating: number;
    reliability_rating: number;
    communication_rating: number;
    cleanliness_rating?: number;
    timeliness_rating?: number;
    asset_rating?: number;
    title: string;
    comment: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post<Rating>('/ratings/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to create rating');
    }
  }
);

export const appealRating = createAsyncThunk(
  'ratings/appealRating',
  async ({ ratingId, reason }: { ratingId: string; reason: string }, { rejectWithValue }) => {
    try {
      await api.post(`/ratings/${ratingId}/appeal/`, { reason });
      return ratingId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to appeal rating');
    }
  }
);

const ratingsSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {
    clearCurrentRating: (state) => {
      state.currentRating = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRatings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRatings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ratings = action.payload;
      })
      .addCase(fetchRatings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createRating.fulfilled, (state, action) => {
        state.ratings.unshift(action.payload);
        state.currentRating = action.payload;
      });
  },
});

export const { clearCurrentRating, clearError } = ratingsSlice.actions;
export default ratingsSlice.reducer;
