import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Asset, AssetFilters, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface AssetsState {
  assets: Asset[];
  currentAsset: Asset | null;
  isLoading: boolean;
  error: string | null;
  count: number;
  next: string | null;
  previous: string | null;
}

const initialState: AssetsState = {
  assets: [],
  currentAsset: null,
  isLoading: false,
  error: null,
  count: 0,
  next: null,
  previous: null,
};

export const fetchAssets = createAsyncThunk(
  'assets/fetchAssets',
  async (filters: AssetFilters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Asset>>('/assets/', { params: filters });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch assets');
    }
  }
);

export const fetchAsset = createAsyncThunk(
  'assets/fetchAsset',
  async (assetId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Asset>(`/assets/${assetId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch asset');
    }
  }
);

export const createAsset = createAsyncThunk(
  'assets/createAsset',
  async (data: Partial<Asset>, { rejectWithValue }) => {
    try {
      const response = await api.post<Asset>('/assets/', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to create asset');
    }
  }
);

export const updateAsset = createAsyncThunk(
  'assets/updateAsset',
  async ({ id, data }: { id: string; data: Partial<Asset> }, { rejectWithValue }) => {
    try {
      const response = await api.patch<Asset>(`/assets/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to update asset');
    }
  }
);

export const checkAvailability = createAsyncThunk(
  'assets/checkAvailability',
  async ({ assetId, startTime, endTime, quantity = 1 }: { assetId: string; startTime: string; endTime: string; quantity?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/assets/${assetId}/availability/`, {
        params: { start_time: startTime, end_time: endTime, quantity },
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to check availability');
    }
  }
);

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    clearCurrentAsset: (state) => {
      state.currentAsset = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assets = action.payload.results;
        state.count = action.payload.count;
        state.next = action.payload.next;
        state.previous = action.payload.previous;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAsset = action.payload;
      })
      .addCase(fetchAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assets.unshift(action.payload);
      })
      .addCase(createAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.assets.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.assets[index] = action.payload;
        }
        if (state.currentAsset?.id === action.payload.id) {
          state.currentAsset = action.payload;
        }
      });
  },
});

export const { clearCurrentAsset, clearError } = assetsSlice.actions;
export default assetsSlice.reducer;
