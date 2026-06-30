import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/api/authService';
import { getStoredItem, setStoredItem, removeStoredItem } from '@/utils/storage';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: getStoredItem('userData'),
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.signup(credentials.email, credentials.password);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Signup failed'));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials.email, credentials.password);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    console.log("Logout to be implemented");
    return;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    hydrateAuth: (state, action: PayloadAction<{ user: User | null; token: string | null }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.user;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Signup handlers
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          role: action.payload.role,
        };
        state.isAuthenticated = true;
        
        // Persist to localStorage
        setStoredItem('userData', state.user);
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login handlers
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          role: action.payload.role,
        };
        state.isAuthenticated = true;
        
        // Persist to localStorage
        setStoredItem('userData', state.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout handlers
    builder
      .addCase(logout.fulfilled, (state) => {
        removeStoredItem('userData');
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, clearAuth, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
