import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: typeof window !== 'undefined' && localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData') as string) : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('authToken') : null,
  isLoading: false,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('authToken') : false,
  error: null,
};

// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.signup(credentials.email, credentials.password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials.email, credentials.password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
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
      state.token = null;
      state.isAuthenticated = false;
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
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', action.payload.accessToken);
          localStorage.setItem('userData', JSON.stringify(state.user));
        }
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
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', action.payload.accessToken);
          localStorage.setItem('userData', JSON.stringify(state.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout handlers
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
