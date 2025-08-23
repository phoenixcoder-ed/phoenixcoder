import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 定义全局状态接口
export interface GlobalState {
  // 用户相关状态
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    permissions: string[];
    isOnline: boolean;
    lastLoginTime: string;
  } | null;

  // UI 状态
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    loading: boolean;
    notifications: Notification[];
    currentPage: string;
    breadcrumbs: BreadcrumbItem[];
  };

  // 应用设置
  settings: {
    language: string;
    timezone: string;
    autoSave: boolean;
    notificationsEnabled: boolean;
  };

  // 缓存数据
  cache: {
    users: unknown[];
    projects: unknown[];
    lastUpdated: Record<string, number>;
  };
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

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'text' | 'outlined' | 'contained';
}

// 定义面包屑接口
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

// 定义状态操作接口
export interface GlobalActions {
  // 用户操作
  setUser: (user: GlobalState['user']) => void;
  updateUserStatus: (isOnline: boolean) => void;
  logout: () => void;

  // UI 操作
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;

  // 通知操作
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // 设置操作
  updateSettings: (settings: Partial<GlobalState['settings']>) => void;

  // 缓存操作
  updateCache: (key: keyof GlobalState['cache'], data: unknown) => void;
  clearCache: (key?: keyof GlobalState['cache']) => void;

  // 重置状态
  reset: () => void;
}

// 初始状态
const initialState: GlobalState = {
  user: null,
  ui: {
    theme: 'light',
    sidebarOpen: true,
    loading: false,
    notifications: [],
    currentPage: '/',
    breadcrumbs: [{ label: '首页', path: '/' }],
  },
  settings: {
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    autoSave: true,
    notificationsEnabled: true,
  },
  cache: {
    users: [],
    projects: [],
    lastUpdated: {},
  },
};

// 创建全局状态存储
export const useGlobalStore = create<GlobalState & GlobalActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // 用户操作
        setUser: (user) => set({ user }, false, 'setUser'),

        updateUserStatus: (isOnline) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, isOnline } : null,
            }),
            false,
            'updateUserStatus'
          ),

        logout: () => set({ user: null }, false, 'logout'),

        // UI 操作
        toggleTheme: () =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                theme: state.ui.theme === 'light' ? 'dark' : 'light',
              },
            }),
            false,
            'toggleTheme'
          ),

        setTheme: (theme) =>
          set(
            (state) => ({
              ui: { ...state.ui, theme },
            }),
            false,
            'setTheme'
          ),

        toggleSidebar: () =>
          set(
            (state) => ({
              ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
            }),
            false,
            'toggleSidebar'
          ),

        setSidebarOpen: (open) =>
          set(
            (state) => ({
              ui: { ...state.ui, sidebarOpen: open },
            }),
            false,
            'setSidebarOpen'
          ),

        setLoading: (loading) =>
          set(
            (state) => ({
              ui: { ...state.ui, loading },
            }),
            false,
            'setLoading'
          ),

        setCurrentPage: (currentPage) =>
          set(
            (state) => ({
              ui: { ...state.ui, currentPage },
            }),
            false,
            'setCurrentPage'
          ),

        setBreadcrumbs: (breadcrumbs) =>
          set(
            (state) => ({
              ui: { ...state.ui, breadcrumbs },
            }),
            false,
            'setBreadcrumbs'
          ),

        // 通知操作
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: Date.now(),
            read: false,
          };

          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: [newNotification, ...state.ui.notifications],
              },
            }),
            false,
            'addNotification'
          );
        },

        removeNotification: (id) =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: state.ui.notifications.filter(
                  (n) => n.id !== id
                ),
              },
            }),
            false,
            'removeNotification'
          ),

        markNotificationAsRead: (id) =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: state.ui.notifications.map((n) =>
                  n.id === id ? { ...n, read: true } : n
                ),
              },
            }),
            false,
            'markNotificationAsRead'
          ),

        clearAllNotifications: () =>
          set(
            (state) => ({
              ui: { ...state.ui, notifications: [] },
            }),
            false,
            'clearAllNotifications'
          ),

        // 设置操作
        updateSettings: (newSettings) =>
          set(
            (state) => ({
              settings: { ...state.settings, ...newSettings },
            }),
            false,
            'updateSettings'
          ),

        // 缓存操作
        updateCache: (key, data) =>
          set(
            (state) => ({
              cache: {
                ...state.cache,
                [key]: data,
                lastUpdated: {
                  ...state.cache.lastUpdated,
                  [key]: Date.now(),
                },
              },
            }),
            false,
            'updateCache'
          ),

        clearCache: (key) =>
          set(
            (state) => {
              if (key) {
                const newCache = { ...state.cache };
                delete newCache[key];
                const newLastUpdated = { ...state.cache.lastUpdated };
                delete newLastUpdated[key];
                return {
                  cache: {
                    ...newCache,
                    lastUpdated: newLastUpdated,
                  },
                };
              } else {
                return {
                  cache: {
                    users: [],
                    projects: [],
                    lastUpdated: {},
                  },
                };
              }
            },
            false,
            'clearCache'
          ),

        // 重置状态
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'phoenix-coder-admin-store',
        partialize: (state) => ({
          user: state.user,
          ui: {
            theme: state.ui.theme,
            sidebarOpen: state.ui.sidebarOpen,
            notifications: state.ui.notifications || [],
          },
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'phoenix-coder-admin',
    }
  )
);

// 选择器函数
export const selectUser = (state: GlobalState & GlobalActions) => state.user;
export const selectUI = (state: GlobalState & GlobalActions) => state.ui;
export const selectSettings = (state: GlobalState & GlobalActions) =>
  state.settings;
export const selectCache = (state: GlobalState & GlobalActions) => state.cache;
export const selectNotifications = (state: GlobalState & GlobalActions) =>
  state.ui.notifications;
export const selectUnreadNotifications = (state: GlobalState & GlobalActions) =>
  (state.ui.notifications || []).filter((n) => !n.read);
