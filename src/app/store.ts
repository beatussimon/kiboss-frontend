import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import assetsReducer from '../features/assets/assetsSlice';
import bookingsReducer from '../features/bookings/bookingsSlice';
import ridesReducer from '../features/rides/ridesSlice';
import messagingReducer from '../features/messaging/messagingSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import ratingsReducer from '../features/ratings/ratingsSlice';
import socialReducer from '../features/social/socialSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetsReducer,
    bookings: bookingsReducer,
    rides: ridesReducer,
    messaging: messagingReducer,
    notifications: notificationsReducer,
    ratings: ratingsReducer,
    social: socialReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
