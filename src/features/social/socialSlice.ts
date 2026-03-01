import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Like, Follow, PublicUser } from '../../types';
import api from '../../services/api';

// Bookmark type
interface Bookmark {
  id: string;
  user: { id: string; email: string; first_name: string; last_name: string };
  entity_type: 'ASSET' | 'RIDE';
  entity_id: string;
  asset?: { id: string; name: string; asset_type: string } | null;
  created_at: string;
}

// Engagement metrics for an entity
interface Engagement {
  like_count: number;
  bookmark_count: number;
  follower_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_following: boolean;
}

interface SocialState {
  likes: Like[];
  bookmarks: Bookmark[];
  following: Follow[];
  followers: Follow[];
  publicProfile: PublicUser | null;
  engagementCache: Record<string, Engagement>; // keyed by "ASSET:id" or "RIDE:id"
  isLoading: boolean;
  error: string | null;
}

const initialState: SocialState = {
  likes: [],
  bookmarks: [],
  following: [],
  followers: [],
  publicProfile: null,
  engagementCache: {},
  isLoading: false,
  error: null,
};

// ─── LIKES ───────────────────────────────────────────

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

export const likeRide = createAsyncThunk(
  'social/likeRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Like>(`/social/likes/rides/${rideId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to like ride');
    }
  }
);

export const unlikeRide = createAsyncThunk(
  'social/unlikeRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/social/likes/rides/${rideId}/`);
      return rideId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to unlike ride');
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

// ─── BOOKMARKS ───────────────────────────────────────

export const bookmarkAsset = createAsyncThunk(
  'social/bookmarkAsset',
  async (assetId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Bookmark>(`/social/bookmarks/assets/${assetId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to bookmark asset');
    }
  }
);

export const unbookmarkAsset = createAsyncThunk(
  'social/unbookmarkAsset',
  async (assetId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/social/bookmarks/assets/${assetId}/`);
      return assetId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to unbookmark asset');
    }
  }
);

export const bookmarkRide = createAsyncThunk(
  'social/bookmarkRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Bookmark>(`/social/bookmarks/rides/${rideId}/`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to bookmark ride');
    }
  }
);

export const unbookmarkRide = createAsyncThunk(
  'social/unbookmarkRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/social/bookmarks/rides/${rideId}/`);
      return rideId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to unbookmark ride');
    }
  }
);

export const fetchBookmarks = createAsyncThunk(
  'social/fetchBookmarks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Bookmark[]>('/social/bookmarks/');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch bookmarks');
    }
  }
);

// ─── FOLLOWS ─────────────────────────────────────────

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

// ─── ENGAGEMENT ──────────────────────────────────────

export const fetchEngagement = createAsyncThunk(
  'social/fetchEngagement',
  async ({ entityType, entityId }: { entityType: 'ASSET' | 'RIDE'; entityId: string }, { rejectWithValue }) => {
    try {
      const response = await api.get<Engagement>(`/social/engagement/${entityType}/${entityId}/`);
      return { key: `${entityType}:${entityId}`, data: response.data };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch engagement');
    }
  }
);

// ─── PUBLIC PROFILE ──────────────────────────────────

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

// ─── SLICE ───────────────────────────────────────────

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic update helpers for engagement cache
    optimisticLike: (state, action: { payload: { entityType: string; entityId: string } }) => {
      const key = `${action.payload.entityType}:${action.payload.entityId}`;
      if (state.engagementCache[key]) {
        state.engagementCache[key].is_liked = true;
        state.engagementCache[key].like_count += 1;
      }
    },
    optimisticUnlike: (state, action: { payload: { entityType: string; entityId: string } }) => {
      const key = `${action.payload.entityType}:${action.payload.entityId}`;
      if (state.engagementCache[key]) {
        state.engagementCache[key].is_liked = false;
        state.engagementCache[key].like_count = Math.max(0, state.engagementCache[key].like_count - 1);
      }
    },
    optimisticBookmark: (state, action: { payload: { entityType: string; entityId: string } }) => {
      const key = `${action.payload.entityType}:${action.payload.entityId}`;
      if (state.engagementCache[key]) {
        state.engagementCache[key].is_bookmarked = true;
        state.engagementCache[key].bookmark_count += 1;
      }
    },
    optimisticUnbookmark: (state, action: { payload: { entityType: string; entityId: string } }) => {
      const key = `${action.payload.entityType}:${action.payload.entityId}`;
      if (state.engagementCache[key]) {
        state.engagementCache[key].is_bookmarked = false;
        state.engagementCache[key].bookmark_count = Math.max(0, state.engagementCache[key].bookmark_count - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Likes
      .addCase(likeAsset.fulfilled, (state, action) => {
        state.likes.unshift(action.payload);
      })
      .addCase(unlikeAsset.fulfilled, (state, action) => {
        state.likes = state.likes.filter((l) => l.asset?.id !== action.payload && l.entity_id !== action.payload);
      })
      .addCase(likeRide.fulfilled, (state, action) => {
        state.likes.unshift(action.payload);
      })
      .addCase(unlikeRide.fulfilled, (state, action) => {
        state.likes = state.likes.filter((l) => l.entity_id !== action.payload);
      })
      .addCase(fetchLikes.fulfilled, (state, action) => {
        state.likes = action.payload;
      })
      // Bookmarks
      .addCase(bookmarkAsset.fulfilled, (state, action) => {
        state.bookmarks.unshift(action.payload);
      })
      .addCase(unbookmarkAsset.fulfilled, (state, action) => {
        state.bookmarks = state.bookmarks.filter((b) => b.entity_id !== action.payload);
      })
      .addCase(bookmarkRide.fulfilled, (state, action) => {
        state.bookmarks.unshift(action.payload);
      })
      .addCase(unbookmarkRide.fulfilled, (state, action) => {
        state.bookmarks = state.bookmarks.filter((b) => b.entity_id !== action.payload);
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
      })
      // Follows
      .addCase(followUser.fulfilled, (state, action) => {
        state.following.unshift(action.payload);
        if (state.publicProfile && state.publicProfile.id === action.payload.following?.id) {
          state.publicProfile.is_following = true;
        }
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.following = state.following.filter((f) => (typeof f.following === 'string' ? f.following : f.following?.id) !== action.payload);
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
      // Engagement
      .addCase(fetchEngagement.fulfilled, (state, action) => {
        state.engagementCache[action.payload.key] = action.payload.data;
      })
      // Public Profile
      .addCase(fetchPublicProfile.fulfilled, (state, action) => {
        state.publicProfile = action.payload;
      });
  },
});

export const {
  clearError,
  optimisticLike,
  optimisticUnlike,
  optimisticBookmark,
  optimisticUnbookmark,
} = socialSlice.actions;
export default socialSlice.reducer;
