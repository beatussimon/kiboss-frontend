import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Like, Follow, PublicUser } from '../../types';
import api from '../../services/api';

interface SocialState {
  likes: Like[];
  following: Follow[];
  followers: Follow[];
  publicProfile: PublicUser | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SocialState = {
  likes: [],
  following: [],
  followers: [],
  publicProfile: null,
  isLoading: false,
  error: null,
};

export const likeAsset = createAsyncThunk(
  'social/likeAsset',
  async (assetId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Like>(`/social/likes/assets/${assetId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to like asset');
    }
  }
);

export const unlikeAsset = createAsyncThunk(
  'social/unlikeAsset',
  async (assetId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/social/likes/assets/${assetId}/`);
      return assetId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to unlike asset');
    }
  }
);

export const fetchLikes = createAsyncThunk(
  'social/fetchLikes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Like[]>('/social/likes/');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch likes');
    }
  }
);

export const followUser = createAsyncThunk(
  'social/followUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Follow>(`/social/follows/users/${userId}/`, { entity_type: 'USER' });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'social/unfollowUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/social/follows/users/${userId}/`);
      return userId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to unfollow user');
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'social/fetchFollowing',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Follow[]>('/social/following/');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch following');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'social/fetchFollowers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Follow[]>('/social/followers/');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch followers');
    }
  }
);

export const fetchPublicProfile = createAsyncThunk(
  'social/fetchPublicProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<PublicUser>(`/users/${userId}/public/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch public profile');
    }
  }
);

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(likeAsset.fulfilled, (state, action) => {
        state.likes.unshift(action.payload);
      })
      .addCase(unlikeAsset.fulfilled, (state, action) => {
        state.likes = state.likes.filter((l) => l.asset.id !== action.payload);
      })
      .addCase(fetchLikes.fulfilled, (state, action) => {
        state.likes = action.payload;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.following.unshift(action.payload);
        if (state.publicProfile && state.publicProfile.id === action.payload.following.id) {
          state.publicProfile.is_following = true;
        }
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.following = state.following.filter((f) => (typeof f.following === 'string' ? f.following : f.following.id) !== action.payload);
        if (state.publicProfile && state.publicProfile.id === action.payload) {
          state.publicProfile.is_following = false;
        }
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.following = action.payload;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload;
      })
      .addCase(fetchPublicProfile.fulfilled, (state, action) => {
        state.publicProfile = action.payload;
      });
  },
});

export const { clearError } = socialSlice.actions;
export default socialSlice.reducer;
