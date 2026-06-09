import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
}

const initialState: SidebarState = {
  isOpen: true,
  isMobile: false,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      if (action.payload) {
        state.isOpen = false; // Close on mobile
      }
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setIsMobile } = sidebarSlice.actions;
export default sidebarSlice.reducer;
