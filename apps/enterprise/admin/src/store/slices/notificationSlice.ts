/**
 * 通知状态管理 Slice
 * 管理系统通知、消息提醒等
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义通知动作接口
export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'text' | 'outlined' | 'contained';
}

// 定义通知接口
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actions?: NotificationAction[];
}

// 定义通知状态接口
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// 初始状态
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

// 创建 slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // 添加通知
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>
    ) => {
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      };

      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
    },

    // 移除通知
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(
        (n) => n.id === action.payload
      );
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(index, 1);
      }
    },

    // 标记通知为已读
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },

    // 标记所有通知为已读
    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },

    // 清除所有通知
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    // 清除已读通知
    clearReadNotifications: (state) => {
      state.notifications = state.notifications.filter((n) => !n.read);
    },
  },
});

// 导出 actions
export const {
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllAsRead,
  clearAllNotifications,
  clearReadNotifications,
} = notificationSlice.actions;

// 导出 selectors
export const selectNotifications = (state: {
  notification: NotificationState;
}) => state.notification.notifications;

export const selectUnreadNotifications = (state: {
  notification: NotificationState;
}) => state.notification.notifications.filter((n) => !n.read);

export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.unreadCount;

export const selectNotificationById =
  (id: string) => (state: { notification: NotificationState }) =>
    state.notification.notifications.find((n) => n.id === id);

// 导出 reducer
export default notificationSlice.reducer;
