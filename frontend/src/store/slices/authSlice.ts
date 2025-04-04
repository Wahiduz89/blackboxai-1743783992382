import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  watchHistory: string[];
  watchlist: string[];
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/auth/login', credentials);
      localStorage.setItem('user', JSON.stringify(data.data));
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/auth/register', userData);
      localStorage.setItem('user', JSON.stringify(data.data));
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${state.auth.user.token}`,
        },
      };
      const { data } = await axios.put('/api/auth/profile', userData, config);
      localStorage.setItem('user', JSON.stringify(data.data));
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'auth/addToWatchlist',
  async (videoId: string, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${state.auth.user.token}`,
        },
      };
      const { data } = await axios.post(`/api/auth/watchlist/${videoId}`, {}, config);
      const updatedUser = { ...state.auth.user, watchlist: data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'auth/removeFromWatchlist',
  async (videoId: string, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${state.auth.user.token}`,
        },
      };
      const { data } = await axios.delete(`/api/auth/watchlist/${videoId}`, config);
      const updatedUser = { ...state.auth.user, watchlist: data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from watchlist');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('user');
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to Watchlist
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        if (state.user) {
          state.user.watchlist = action.payload;
        }
      })
      // Remove from Watchlist
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        if (state.user) {
          state.user.watchlist = action.payload;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;