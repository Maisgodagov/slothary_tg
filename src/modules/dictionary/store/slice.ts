import { createSlice } from '@reduxjs/toolkit';

import type { DictionaryState } from './types';

const initialState: DictionaryState = {
  lastQuery: null,
};

const dictionarySlice = createSlice({
  name: 'dictionaryModule',
  initialState,
  reducers: {
    setLastQuery: (state, action: { payload: string | null }) => {
      state.lastQuery = action.payload;
    },
  },
});

export const { setLastQuery } = dictionarySlice.actions;
export default dictionarySlice.reducer;
