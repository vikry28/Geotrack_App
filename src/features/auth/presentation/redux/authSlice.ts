import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { UserRepositoryImpl } from '../../data/repositories/UserRepositoryImpl';
import { LocalAuthDatasourceImpl } from '../../data/datasources/LocalAuthDatasource';
import { LoginUseCase } from '../../domain/usecases/LoginUseCase';
import { RegisterUseCase } from '../../domain/usecases/RegisterUseCase';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  username: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  userId: null,
  username: null,
  email: null,
  loading: false,
  error: null,
};

const authDatasource = new LocalAuthDatasourceImpl();
const userRepo = new UserRepositoryImpl();
const loginUseCase = new LoginUseCase(userRepo);
const registerUseCase = new RegisterUseCase(userRepo);

// ─── Load persisted session ────────────────────────────────────────────────
export const loadStoredSession = createAsyncThunk('auth/loadStoredSession', async () => {
  const session = await authDatasource.getSession();
  return session;
});

// ─── Mock Login ────────────────────────────────────────────────────────────
export const mockLogin = createAsyncThunk(
  'auth/mockLogin',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await loginUseCase.execute(payload.email, payload.password);
      const dummyToken = `mock-token-${Date.now()}`;
      
      const session = {
        token: dummyToken,
        userId: user.id,
        username: user.username,
        email: user.email,
      };
      
      await authDatasource.saveSession(session);
      return session;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Login gagal. Coba lagi.');
    }
  }
);

// ─── Mock Register ─────────────────────────────────────────────────────────
export const mockRegister = createAsyncThunk(
  'auth/mockRegister',
  async (
    payload: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const user = await registerUseCase.execute(payload.username, payload.email, payload.password);
      const dummyToken = `mock-token-${Date.now()}`;
      
      const session = {
        token: dummyToken,
        userId: user.id,
        username: user.username,
        email: user.email,
      };
      
      await authDatasource.saveSession(session);
      return session;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Registrasi gagal. Coba lagi.');
    }
  }
);

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = createAsyncThunk('auth/logout', async () => {
  await authDatasource.clearSession();
});

// ─── Slice ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load session
      .addCase(loadStoredSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.token) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.userId = action.payload.userId;
          state.username = action.payload.username;
          state.email = action.payload.email;
        }
      })
      .addCase(loadStoredSession.rejected, (state) => {
        state.loading = false;
      })
      // Login
      .addCase(mockLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mockLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.username = action.payload.username;
        state.email = action.payload.email;
      })
      .addCase(mockLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(mockRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mockRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.username = action.payload.username;
        state.email = action.payload.email;
      })
      .addCase(mockRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.userId = null;
        state.username = null;
        state.email = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
