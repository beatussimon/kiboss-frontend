import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Asset } from '../../types';

interface WishlistState {
  items: Asset[];
}

const getInitialWishlist = () => {
  try {
    const saved = localStorage.getItem('kiboss_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const initialState: WishlistState = {
  items: getInitialWishlist(),
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<Asset>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index === -1) {
        state.items.push(action.payload);
      } else {
        state.items.splice(index, 1);
      }
      localStorage.setItem('kiboss_wishlist', JSON.stringify(state.items));
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      localStorage.setItem('kiboss_wishlist', JSON.stringify(state.items));
    },
  },
});

export const { toggleWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
