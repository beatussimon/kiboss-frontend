import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  source?: string; // 'gps' | 'ipapi' | 'manual'
}

interface LocationState {
  userLocation: UserLocation | null;
  isLocationModalShown: boolean;
  isLocationPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  userLocation: null,
  isLocationModalShown: false,
  isLocationPermissionGranted: false,
  isLoading: false,
  error: null,
};

// Load location from localStorage on init
const loadSavedLocation = (): UserLocation | null => {
  try {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      const location = JSON.parse(saved) as UserLocation;
      // Check if location is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
      if (Date.now() - location.timestamp < maxAge) {
        return location;
      }
    }
  } catch (e) {
    console.error('Failed to load saved location:', e);
  }
  return null;
};

// Initialize with saved location if available
const savedLocation = loadSavedLocation();
if (savedLocation) {
  initialState.userLocation = savedLocation;
  initialState.isLocationPermissionGranted = true;
}

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<UserLocation>) => {
      state.userLocation = action.payload;
      state.isLocationPermissionGranted = true;
      state.isLoading = false;
      state.error = null;
    },
    setLocationModalShown: (state, action: PayloadAction<boolean>) => {
      state.isLocationModalShown = action.payload;
    },
    setLocationPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.isLocationPermissionGranted = action.payload;
    },
    clearUserLocation: (state) => {
      state.userLocation = null;
      localStorage.removeItem('userLocation');
    },
    setLocationLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { 
  setUserLocation, 
  setLocationModalShown, 
  setLocationPermissionGranted, 
  clearUserLocation,
  setLocationLoading,
  setLocationError 
} = locationSlice.actions;

export default locationSlice.reducer;
