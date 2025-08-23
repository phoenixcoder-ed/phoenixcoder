/**
 * UI 状态管理 Slice
 * 管理主题、侧边栏、加载状态、面包屑等 UI 相关状态
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义面包屑接口
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

// 定义 UI 状态接口
export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  currentPage: string;
  breadcrumbs: BreadcrumbItem[];
}

// 初始状态
const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  loading: false,
  currentPage: '/',
  breadcrumbs: [{ label: '首页', path: '/' }],
};

// 创建 slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // 切换主题
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // 设置主题
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },

    // 切换侧边栏
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    // 设置侧边栏状态
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // 设置加载状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // 设置当前页面
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },

    // 设置面包屑
    setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => {
      state.breadcrumbs = action.payload;
    },

    // 添加面包屑项
    addBreadcrumb: (state, action: PayloadAction<BreadcrumbItem>) => {
      state.breadcrumbs.push(action.payload);
    },

    // 移除面包屑项
    removeBreadcrumb: (state, action: PayloadAction<number>) => {
      state.breadcrumbs.splice(action.payload, 1);
    },

    // 重置 UI 状态
    resetUI: (state) => {
      Object.assign(state, initialState);
    },
  },
});

// 导出 actions
export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setCurrentPage,
  setBreadcrumbs,
  addBreadcrumb,
  removeBreadcrumb,
  resetUI,
} = uiSlice.actions;

// 导出 selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarOpen = (state: { ui: UIState }) =>
  state.ui.sidebarOpen;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectCurrentPage = (state: { ui: UIState }) =>
  state.ui.currentPage;
export const selectBreadcrumbs = (state: { ui: UIState }) =>
  state.ui.breadcrumbs;

// 导出 reducer
export default uiSlice.reducer;
