import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, type LoginRequest, type LoginResponse, type RegisterRequest, type UserProfile } from './api';
import type { RootState } from '../../app/store';

interface AuthState {
  profile: UserProfile | null;
  tokens: LoginResponse['tokens'] | null;
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: AuthState = {
  profile: null,
  tokens: null,
  status: 'idle',
};

export const login = createAsyncThunk<LoginResponse, LoginRequest>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.login(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось войти';
    return rejectWithValue(message);
  }
});

export const register = createAsyncThunk<LoginResponse, RegisterRequest>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось зарегистрироваться';
      return rejectWithValue(message);
    }
  },
);

export const telegramAuth = createAsyncThunk<LoginResponse, string>('auth/telegramAuth', async (initData, { rejectWithValue }) => {
  try {
    return await authApi.telegramAuth(initData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telegram авторизация не удалась';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.profile = null;
      state.tokens = null;
      state.status = 'idle';
      state.error = undefined;
    },
    setProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.status = 'loading';
      state.error = undefined;
    };
    const handleFulfilled = (state: AuthState, action: PayloadAction<LoginResponse>) => {
      state.status = 'idle';
      state.profile = action.payload.profile;
      state.tokens = action.payload.tokens;
    };
    const handleRejected = (state: AuthState, action: PayloadAction<unknown>) => {
      state.status = 'failed';
      state.error = typeof action.payload === 'string' ? action.payload : 'Ошибка авторизации';
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(telegramAuth.pending, handlePending)
      .addCase(telegramAuth.fulfilled, handleFulfilled)
      .addCase(telegramAuth.rejected, handleRejected);
  },
});

export const { logout, setProfile } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
