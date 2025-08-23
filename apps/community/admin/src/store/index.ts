/**
 * Redux Store 配置
 * 使用 Redux Toolkit 进行状态管理
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// 导入所有 slice
import authReducer from './slices/authSlice';
import knowledgeBaseReducer from './slices/knowledgeBaseSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import userManagementReducer from './slices/userManagementSlice';
import validationReducer from './slices/validationSlice';

// 配置 store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    userManagement: userManagementReducer,
    knowledgeBase: knowledgeBaseReducer,
    validation: validationReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出类型化的 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
