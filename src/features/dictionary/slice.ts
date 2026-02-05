import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  dictionaryApi,
  type CreateUserDictionaryEntry,
  type CreateUserPhraseEntry,
  type UserDictionaryEntry,
} from "./api";

interface DictionaryState {
  items: UserDictionaryEntry[];
  status: "idle" | "loading" | "failed";
  error?: string;
}

const initialState: DictionaryState = {
  items: [],
  status: "idle",
};

export const fetchDictionary = createAsyncThunk<
  UserDictionaryEntry[],
  void,
  { state: RootState }
>("dictionary/fetch", async (_, { getState, rejectWithValue }) => {
  const { auth } = getState();
  if (!auth.profile?.id) {
    return rejectWithValue("пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ, пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ.");
  }
  try {
    return await dictionaryApi.getUserDictionary(auth.profile.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ.";
    return rejectWithValue(message);
  }
});

export const addWord = createAsyncThunk<
  UserDictionaryEntry,
  CreateUserDictionaryEntry,
  { state: RootState }
>("dictionary/add", async (payload, { getState, rejectWithValue }) => {
  const { auth } = getState();
  if (!auth.profile?.id) {
    return rejectWithValue("пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ, пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ.");
  }
  try {
    return await dictionaryApi.addUserDictionaryEntry(auth.profile.id, payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ.";
    return rejectWithValue(message);
  }
});

export const addPhrase = createAsyncThunk<
  UserDictionaryEntry,
  CreateUserPhraseEntry,
  { state: RootState }
>("dictionary/addPhrase", async (payload, { getState, rejectWithValue }) => {
  const { auth } = getState();
  if (!auth.profile?.id) {
    return rejectWithValue("????? ?????, ????? ???????? ?????.");
  }
  try {
    return await dictionaryApi.addUserPhraseEntry(auth.profile.id, payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "?? ??????? ???????? ?????.";
    return rejectWithValue(message);
  }
});

export const removeWord = createAsyncThunk<string, string, { state: RootState }>(
  "dictionary/remove",
  async (id, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.profile?.id) {
      return rejectWithValue("пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ, пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ.");
    }
    try {
      await dictionaryApi.deleteUserDictionaryEntry(auth.profile.id, id);
      return id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ.";
      return rejectWithValue(message);
    }
  }
);

export const removePhrase = createAsyncThunk<string, string, { state: RootState }>(
  "dictionary/removePhrase",
  async (id, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.profile?.id) {
      return rejectWithValue("????? ?????, ????? ??????? ?????.");
    }
    try {
      await dictionaryApi.deleteUserPhraseEntry(auth.profile.id, id);
      return id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "?? ??????? ??????? ?????.";
      return rejectWithValue(message);
    }
  }
);


const dictionarySlice = createSlice({
  name: "dictionary",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDictionary.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(
        fetchDictionary.fulfilled,
        (state, action: PayloadAction<UserDictionaryEntry[]>) => {
          state.status = "idle";
          state.items = action.payload;
        }
      )
      .addCase(fetchDictionary.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? "пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ.";
      })
      .addCase(addWord.fulfilled, (state, action: PayloadAction<UserDictionaryEntry>) => {
        const payload = { ...action.payload, type: action.payload.type ?? "word" };
        state.items = [payload, ...state.items];
      })
      .addCase(addPhrase.fulfilled, (state, action: PayloadAction<UserDictionaryEntry>) => {
        const payload = { ...action.payload, type: action.payload.type ?? "phrase" };
        state.items = [payload, ...state.items];
      })
      .addCase(removeWord.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(removePhrase.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const selectDictionary = (state: RootState) => state.dictionary;
export default dictionarySlice.reducer;
