import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Contract, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface ContractsState {
  contracts: Contract[];
  currentContract: Contract | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ContractsState = {
  contracts: [],
  currentContract: null,
  isLoading: false,
  error: null,
};

export const fetchContracts = createAsyncThunk(
  'contracts/fetchContracts',
  async (filters: { booking_id?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Contract>>('/contracts/', { params: filters });
      return response.data.results;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch contracts');
    }
  }
);

export const fetchContract = createAsyncThunk(
  'contracts/fetchContract',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Contract>(`/contracts/${id}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch contract');
    }
  }
);

export const acceptContract = createAsyncThunk(
  'contracts/acceptContract',
  async ({ id, signature }: { id: string; signature: any }, { rejectWithValue }) => {
    try {
      const response = await api.post<Contract>(`/contracts/${id}/accept/`, { signature });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to accept contract');
    }
  }
);

const contractsSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    clearCurrentContract: (state) => {
      state.currentContract = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contracts = action.payload;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchContract.fulfilled, (state, action) => {
        state.currentContract = action.payload;
      })
      .addCase(acceptContract.fulfilled, (state, action) => {
        state.currentContract = action.payload;
        // Update in list as well
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
      });
  },
});

export const { clearCurrentContract } = contractsSlice.actions;
export default contractsSlice.reducer;
