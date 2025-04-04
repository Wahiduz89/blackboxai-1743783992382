import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  genre: string[];
  rating: number;
  views: number;
  releaseYear: number;
  cast: string[];
  director: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VideoState {
  videos: Video[];
  featuredVideos: Video[];
  trendingVideos: Video[];
  currentVideo: Video | null;
  loading: boolean;
  error: string | null;
  page: number;
  pages: number;
  hasMore: boolean;
}

const initialState: VideoState = {
  videos: [],
  featuredVideos: [],
  trendingVideos: [],
  currentVideo: null,
  loading: false,
  error: null,
  page: 1,
  pages: 1,
  hasMore: true,
};

export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async ({ page = 1, keyword = '', genre = '' }: { page?: number; keyword?: string; genre?: string }, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/videos?page=${page}&keyword=${keyword}&genre=${genre}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch videos');
    }
  }
);

export const fetchFeaturedVideos = createAsyncThunk(
  'videos/fetchFeaturedVideos',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('/api/videos/featured');
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured videos');
    }
  }
);

export const fetchTrendingVideos = createAsyncThunk(
  'videos/fetchTrendingVideos',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('/api/videos/trending');
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trending videos');
    }
  }
);

export const fetchVideoById = createAsyncThunk(
  'videos/fetchVideoById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/videos/${id}`);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch video');
    }
  }
);

export const createVideo = createAsyncThunk(
  'videos/createVideo',
  async (videoData: Partial<Video>, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${state.auth.user.token}`,
        },
      };
      const { data } = await axios.post('/api/videos', videoData, config);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create video');
    }
  }
);

export const updateVideo = createAsyncThunk(
  'videos/updateVideo',
  async ({ id, videoData }: { id: string; videoData: Partial<Video> }, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${state.auth.user.token}`,
        },
      };
      const { data } = await axios.put(`/api/videos/${id}`, videoData, config);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update video');
    }
  }
);

export const deleteVideo = createAsyncThunk(
  'videos/deleteVideo',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${state.auth.user.token}`,
        },
      };
      await axios.delete(`/api/videos/${id}`, config);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete video');
    }
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearVideoError: (state) => {
      state.error = null;
    },
    clearCurrentVideo: (state) => {
      state.currentVideo = null;
    },
    resetVideos: (state) => {
      state.videos = [];
      state.page = 1;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Videos
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = state.page === 1 ? action.payload.data.videos : [...state.videos, ...action.payload.data.videos];
        state.pages = action.payload.data.pages;
        state.hasMore = state.page < action.payload.data.pages;
        state.page += 1;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Featured Videos
      .addCase(fetchFeaturedVideos.fulfilled, (state, action) => {
        state.featuredVideos = action.payload;
      })
      // Fetch Trending Videos
      .addCase(fetchTrendingVideos.fulfilled, (state, action) => {
        state.trendingVideos = action.payload;
      })
      // Fetch Video By Id
      .addCase(fetchVideoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVideo = action.payload;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Video
      .addCase(createVideo.fulfilled, (state, action) => {
        state.videos.unshift(action.payload);
      })
      // Update Video
      .addCase(updateVideo.fulfilled, (state, action) => {
        const index = state.videos.findIndex(video => video._id === action.payload._id);
        if (index !== -1) {
          state.videos[index] = action.payload;
        }
        if (state.currentVideo?._id === action.payload._id) {
          state.currentVideo = action.payload;
        }
      })
      // Delete Video
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.videos = state.videos.filter(video => video._id !== action.payload);
        if (state.currentVideo?._id === action.payload) {
          state.currentVideo = null;
        }
      });
  },
});

export const { clearVideoError, clearCurrentVideo, resetVideos } = videoSlice.actions;
export default videoSlice.reducer;