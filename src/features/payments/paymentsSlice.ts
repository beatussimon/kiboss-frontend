import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Payment, PaginatedResponse } from '../../types';
import api from '../../services/api';

interface PaymentsState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  summary: {
    total_paid: number;
    total_received: number;
    in_escrow: number;
  };
}

const initialState: PaymentsState = {
  payments: [],
  isLoading: false,
  error: null,
  summary: {
    total_paid: 0,
    total_received: 0,
    in_escrow: 0,
  },
};

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<PaginatedResponse<Payment>>('/payments/');
      return response.data.results;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const fetchPaymentSummary = createAsyncThunk(
  'payments/fetchPaymentSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/summary/');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export default paymentsSlice.reducer;
