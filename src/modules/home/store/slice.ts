import { createSlice } from '@reduxjs/toolkit';

import type { HomeState } from './types';

const initialState: HomeState = {
  lastStatsUpdatedAt: null,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setLastStatsUpdatedAt: (state, action: { payload: string | null }) => {
      state.lastStatsUpdatedAt = action.payload;
    },
  },
});

export const { setLastStatsUpdatedAt } = homeSlice.actions;
export default homeSlice.reducer;
