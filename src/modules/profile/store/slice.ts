import { createSlice } from '@reduxjs/toolkit';

import type { ProfileState } from './types';

const initialState: ProfileState = {
  lastVisitedAt: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setLastVisitedAt: (state, action: { payload: string | null }) => {
      state.lastVisitedAt = action.payload;
    },
  },
});

export const { setLastVisitedAt } = profileSlice.actions;
export default profileSlice.reducer;
