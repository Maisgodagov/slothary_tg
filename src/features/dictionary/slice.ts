import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { dictionaryApi, type CreateUserDictionaryEntry, type UserDictionaryEntry } from './api';

interface DictionaryState {
  items: UserDictionaryEntry[];
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: DictionaryState = {
  items: [],
  status: 'idle',
};

export const fetchDictionary = createAsyncThunk<UserDictionaryEntry[], void, { state: RootState }>(
  'dictionary/fetch',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.profile?.id) {
      return rejectWithValue('Войдите, чтобы видеть словарь');
    }
    try {
      return await dictionaryApi.getUserDictionary(auth.profile.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить словарь';
      return rejectWithValue(message);
    }
  },
);

export const addWord = createAsyncThunk<UserDictionaryEntry, CreateUserDictionaryEntry, { state: RootState }>(
  'dictionary/add',
  async (payload, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.profile?.id) {
      return rejectWithValue('Войдите, чтобы сохранять слова');
    }
    try {
      return await dictionaryApi.addUserDictionaryEntry(auth.profile.id, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить слово';
      return rejectWithValue(message);
    }
  },
);

const dictionarySlice = createSlice({
  name: 'dictionary',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDictionary.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchDictionary.fulfilled, (state, action: PayloadAction<UserDictionaryEntry[]>) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchDictionary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Ошибка загрузки словаря';
      })
      .addCase(addWord.fulfilled, (state, action: PayloadAction<UserDictionaryEntry>) => {
        state.items = [action.payload, ...state.items];
      });
  },
});

export const selectDictionary = (state: RootState) => state.dictionary;
export default dictionarySlice.reducer;
