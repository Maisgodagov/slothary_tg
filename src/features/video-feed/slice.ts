import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { videoFeedApi } from './api';
import type { VideoFeedItem, VideoFeedResponse } from './types';
import type { RootState } from '../../app/store';

interface VideoFeedState {
  items: VideoFeedItem[];
  status: 'idle' | 'loading' | 'refreshing' | 'failed';
  cursor: string | null;
  hasMore: boolean;
  fetchedCursors: (string | null)[];
  error?: string;
}

const initialState: VideoFeedState = {
  items: [],
  status: 'idle',
  cursor: null,
  hasMore: true,
  fetchedCursors: [],
};

let cachedGuestId: string | null = null;
const getGuestId = () => {
  if (cachedGuestId) return cachedGuestId;
  try {
    const fromStorage = localStorage.getItem('guestUserId');
    if (fromStorage) {
      cachedGuestId = fromStorage;
      return cachedGuestId;
    }
    const newId = crypto.randomUUID();
    localStorage.setItem('guestUserId', newId);
    cachedGuestId = newId;
    return cachedGuestId;
  } catch {
    cachedGuestId = `guest-${Math.random().toString(36).slice(2, 10)}`;
    return cachedGuestId;
  }
};

export const loadFeed = createAsyncThunk<VideoFeedResponse, { reset?: boolean } | undefined, { state: RootState }>(
  'videoFeed/load',
  async (options, { getState, rejectWithValue }) => {
    const { auth, videoFeed } = getState();
    const userId = auth.profile?.id ?? getGuestId();
    try {
      return await videoFeedApi.getFeed(userId, {
        cursor: options?.reset ? null : videoFeed.cursor,
        limit: 20,
        role: auth.profile?.role ?? null,
        moderationFilter: 'all',
        showAdultContent: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить ленту';
      return rejectWithValue(message);
    }
  },
);

export const toggleLike = createAsyncThunk<
  { contentId: string; likesCount: number; isLiked: boolean },
  string,
  { state: RootState }
>('videoFeed/toggleLike', async (contentId, { getState, rejectWithValue }) => {
  const state = getState();
  const { auth, videoFeed } = state;
  const target = videoFeed.items.find((item) => item.id === contentId);
  const nextLike = target ? !target.isLiked : true;

  if (!auth.profile?.id) {
    return rejectWithValue('Нужно войти, чтобы ставить лайк');
  }

  try {
    const response = await videoFeedApi.updateLike(auth.profile.id, contentId, nextLike, auth.profile.role ?? null);
    return { contentId, ...response };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить лайк';
    return rejectWithValue(message);
  }
});

const videoFeedSlice = createSlice({
  name: 'videoFeed',
  initialState,
  reducers: {
    resetFeed: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFeed.pending, (state, action) => {
        state.status = action.meta.arg?.reset ? 'loading' : 'refreshing';
        state.error = undefined;
        if (action.meta.arg?.reset) {
          state.items = [];
          state.cursor = null;
          state.hasMore = true;
          state.fetchedCursors = [];
        }
      })
      .addCase(loadFeed.fulfilled, (state, action: PayloadAction<VideoFeedResponse>) => {
        state.status = 'idle';
        const existingIds = new Set(state.items.map((i) => i.id));
        const newItems = action.payload.items.filter((i) => !existingIds.has(i.id));
        state.items = [...state.items, ...newItems];
        state.cursor = action.payload.nextCursor;
        state.fetchedCursors = [...state.fetchedCursors, action.payload.nextCursor ?? null];
        const noMore = !action.payload.nextCursor || newItems.length === 0;
        state.hasMore = action.payload.hasMore && !noMore;
      })
      .addCase(loadFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Ошибка загрузки ленты';
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.contentId
            ? { ...item, likesCount: action.payload.likesCount, isLiked: action.payload.isLiked }
            : item,
        );
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.error = (action.payload as string) ?? state.error;
      });
  },
});

export const { resetFeed } = videoFeedSlice.actions;
export const selectVideoFeed = (state: RootState) => state.videoFeed;

export default videoFeedSlice.reducer;
