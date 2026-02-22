import { createSlice } from '@reduxjs/toolkit';

import type { WordTrainingModuleState } from './types';

const initialState: WordTrainingModuleState = {
  lastSessionId: null,
};

const wordTrainingModuleSlice = createSlice({
  name: 'wordTrainingModule',
  initialState,
  reducers: {
    setLastSessionId: (state, action: { payload: string | null }) => {
      state.lastSessionId = action.payload;
    },
  },
});

export const { setLastSessionId } = wordTrainingModuleSlice.actions;
export default wordTrainingModuleSlice.reducer;

