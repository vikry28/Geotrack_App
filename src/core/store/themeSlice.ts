import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

const THEME_STORE_KEY = 'user_theme_preference';

interface ThemeState {
  mode: 'light' | 'dark';
}

const initialState: ThemeState = {
  mode: 'light', // Default to light mode (as requested)
};

// Async thunk to load the saved theme preference
export const loadStoredTheme = createAsyncThunk('theme/loadStoredTheme', async () => {
  try {
    const savedTheme = await SecureStore.getItemAsync(THEME_STORE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  } catch (error) {
    console.error('Failed to load theme preference', error);
  }
  return 'light';
});

// Async thunk to save and switch theme
export const toggleTheme = createAsyncThunk('theme/toggleTheme', async (_, { getState }) => {
  const state = getState() as { theme: ThemeState };
  const nextTheme = state.theme.mode === 'light' ? 'dark' : 'light';
  try {
    await SecureStore.setItemAsync(THEME_STORE_KEY, nextTheme);
  } catch (error) {
    console.error('Failed to save theme preference', error);
  }
  return nextTheme;
});

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredTheme.fulfilled, (state, action) => {
        state.mode = action.payload;
      })
      .addCase(toggleTheme.fulfilled, (state, action) => {
        state.mode = action.payload;
      });
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
