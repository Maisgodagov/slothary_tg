import { createSlice } from '@reduxjs/toolkit';

import type { AdminState } from './types';

const initialState: AdminState = {
  lastVisitedAt: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setLastVisitedAt: (state, action: { payload: string | null }) => {
      state.lastVisitedAt = action.payload;
    },
  },
});

export const { setLastVisitedAt } = adminSlice.actions;
export default adminSlice.reducer;
