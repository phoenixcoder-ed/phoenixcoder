import { EventEmitter } from 'events';

import { useGlobalStore } from '@/shared/store/globalStore';
import { logger } from '@/shared/utils/logger';

export type InteractionEvent =
  | 'user:login'
  | 'user:logout'
  | 'ui:theme:change'
  | 'ui:page:change'
  | 'notification:add'
  | 'data:refresh'
  | 'error:handle'
  | 'success:handle';

export interface InteractionContext {
  source: string;
  timestamp: number;
  userId?: string;
  data?: unknown;
}

export type InteractionHandler = (
  context: InteractionContext
) => Promise<void> | void;

export interface InteractionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

class InteractionManagerClass extends EventEmitter {
  private handlers = new Map<InteractionEvent, InteractionHandler[]>();

  constructor() {
    super();
    this.setupDefaultHandlers();
  }

  addHandler(event: InteractionEvent, handler: InteractionHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  removeHandler(event: InteractionEvent, handler: InteractionHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async trigger(
    event: InteractionEvent,
    context: Partial<InteractionContext> = {}
  ): Promise<InteractionResult> {
    const fullContext: InteractionContext = {
      source: 'unknown',
      timestamp: Date.now(),
      ...context,
    };

    try {
      const handlers = this.handlers.get(event) || [];
      await Promise.all(handlers.map((handler) => handler(fullContext)));
      this.emit(event, fullContext);
      return { success: true, message: 'Event processed successfully' };
    } catch (error) {
      logger.error(`Error processing interaction event ${event}:`, error);
      return {
        success: false,
        message: 'Failed to process event',
      };
    }
  }

  private setupDefaultHandlers(): void {
    this.addHandler('user:login', async (context) => {
      const { setUser, addNotification } = useGlobalStore.getState();
      if (
        context.data &&
        typeof context.data === 'object' &&
        'user' in context.data &&
        context.data.user &&
        typeof context.data.user === 'object'
      ) {
        const userData = context.data.user as Record<string, unknown>;
        // 确保用户数据包含必需的字段
        if (
          userData.id &&
          userData.name &&
          userData.email &&
          typeof userData.id === 'string' &&
          typeof userData.name === 'string' &&
          typeof userData.email === 'string'
        ) {
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: (userData.avatar as string) || '',
            role: (userData.role as string) || 'user',
            permissions: Array.isArray(userData.permissions)
              ? (userData.permissions as string[])
              : [],
            isOnline: true,
            lastLoginTime: new Date().toISOString(),
          });
          addNotification({
            type: 'success',
            title: '登录成功',
            message: '欢迎回来！',
          });
        }
      }
    });

    this.addHandler('user:logout', async () => {
      const { logout, addNotification, clearCache } = useGlobalStore.getState();
      logout();
      clearCache();
      addNotification({
        type: 'info',
        title: '已登出',
        message: '您已安全登出系统',
      });
    });

    this.addHandler('ui:theme:change', async () => {
      const { toggleTheme } = useGlobalStore.getState();
      toggleTheme();
    });

    this.addHandler('ui:page:change', async (context) => {
      const { setCurrentPage, setBreadcrumbs } = useGlobalStore.getState();
      if (context.data && typeof context.data === 'object') {
        const data = context.data as Record<string, unknown>;
        if (data.page && typeof data.page === 'string') {
          setCurrentPage(data.page);
        }
        if (Array.isArray(data.breadcrumbs)) {
          setBreadcrumbs(data.breadcrumbs);
        }
      }
    });

    this.addHandler('error:handle', async (context) => {
      const { addNotification } = useGlobalStore.getState();
      const message =
        context.data &&
        typeof context.data === 'object' &&
        'message' in context.data
          ? String(context.data.message)
          : '发生了未知错误';
      addNotification({
        type: 'error',
        title: '操作失败',
        message,
      });
    });

    this.addHandler('success:handle', async (context) => {
      const { addNotification } = useGlobalStore.getState();
      const message =
        context.data &&
        typeof context.data === 'object' &&
        'message' in context.data
          ? String(context.data.message)
          : '操作已成功完成';
      addNotification({
        type: 'success',
        title: '操作成功',
        message,
      });
    });

    this.addHandler('data:refresh', async (context) => {
      const { setLoading, updateCache } = useGlobalStore.getState();
      setLoading(true);

      try {
        if (context.data && typeof context.data === 'object') {
          const data = context.data as Record<string, unknown>;
          if (data.type && data.data) {
            updateCache(data.type as 'users' | 'projects', data.data);
          }
        }
      } finally {
        setLoading(false);
      }
    });
  }
}

export const InteractionManager = new InteractionManagerClass();

export const useInteractionManager = () => {
  const trigger = (
    event: InteractionEvent,
    context?: Partial<InteractionContext>
  ) => InteractionManager.trigger(event, context);

  const on = (event: InteractionEvent, handler: InteractionHandler) =>
    InteractionManager.addHandler(event, handler);

  const off = (event: InteractionEvent, handler: InteractionHandler) =>
    InteractionManager.removeHandler(event, handler);

  return { trigger, on, off };
};

export default InteractionManager;
