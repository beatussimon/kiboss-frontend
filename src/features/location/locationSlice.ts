import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface LocationState {
  userLocation: UserLocation | null;
  isLocationModalShown: boolean;
  isLocationPermissionGranted: boolean;
}

const initialState: LocationState = {
  userLocation: null,
  isLocationModalShown: false,
  isLocationPermissionGranted: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<UserLocation>) => {
      state.userLocation = action.payload;
      state.isLocationPermissionGranted = true;
    },
    setLocationModalShown: (state, action: PayloadAction<boolean>) => {
      state.isLocationModalShown = action.payload;
    },
    setLocationPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.isLocationPermissionGranted = action.payload;
    },
    clearUserLocation: (state) => {
      state.userLocation = null;
    },
  },
});

export const { setUserLocation, setLocationModalShown, setLocationPermissionGranted, clearUserLocation } = locationSlice.actions;
export default locationSlice.reducer;
