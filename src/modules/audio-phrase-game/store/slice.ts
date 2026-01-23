import { createSlice } from '@reduxjs/toolkit';

import type { AudioPhraseGameState } from './types';

const initialState: AudioPhraseGameState = {
  lastPlayedAt: null,
  lastDifficulty: null,
};

const audioPhraseGameSlice = createSlice({
  name: 'audioPhraseGame',
  initialState,
  reducers: {
    setLastPlayedAt: (state, action: { payload: string | null }) => {
      state.lastPlayedAt = action.payload;
    },
    setLastDifficulty: (state, action: { payload: 1 | 2 | 3 | null }) => {
      state.lastDifficulty = action.payload;
    },
  },
});

export const { setLastPlayedAt, setLastDifficulty } = audioPhraseGameSlice.actions;
export default audioPhraseGameSlice.reducer;
