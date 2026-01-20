import { createSlice } from '@reduxjs/toolkit';

import type { VideoState } from './types';

const initialState: VideoState = {
  lastOpenedContentId: null,
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setLastOpenedContentId: (state, action: { payload: string | null }) => {
      state.lastOpenedContentId = action.payload;
    },
  },
});

export const { setLastOpenedContentId } = videoSlice.actions;
export default videoSlice.reducer;
