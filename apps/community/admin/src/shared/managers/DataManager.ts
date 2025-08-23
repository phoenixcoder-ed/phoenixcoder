import { create } from 'zustand';

// 数据操作类型
export type DataOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

// 数据状态接口
export interface DataState<T = unknown> {
  data: T | null;
  list: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: Record<string, unknown>;
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  } | null;
}

// 数据操作接口
export interface DataActions<T = unknown> {
  setData: (data: T | null) => void;
  setList: (list: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<DataState['pagination']>) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setSorting: (sorting: DataState['sorting']) => void;
  reset: () => void;
}

// API 配置接口
export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    list: string;
    create: string;
    read: string;
    update: string;
    delete: string;
  };
  headers?: Record<string, string>;
  transformRequest?: (data: unknown) => unknown;
  transformResponse?: (data: unknown) => unknown;
}

// 创建数据管理器
export function createDataManager<T extends { id: string | number }>(
  name: string,
  apiConfig?: ApiConfig
) {
  const initialState: DataState<T> = {
    data: null,
    list: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    },
    filters: {},
    sorting: null,
  };

  const useStore = create<DataState<T> & DataActions<T>>((set) => ({
    ...initialState,

    setData: (data) => set({ data }),

    setList: (list) => set({ list }),

    addItem: (item) =>
      set((state) => ({
        list: [item, ...state.list],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      })),

    updateItem: (id, updates) =>
      set((state) => ({
        list: state.list.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
        data:
          state.data && (state.data as T).id === id
            ? { ...state.data, ...updates }
            : state.data,
      })),

    removeItem: (id) =>
      set((state) => ({
        list: state.list.filter((item) => item.id !== id),
        data: state.data && (state.data as T).id === id ? null : state.data,
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
      })),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    setPagination: (pagination) =>
      set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),

    setFilters: (filters) => set({ filters }),

    setSorting: (sorting) => set({ sorting }),

    reset: () => set(initialState),
  }));

  // API 操作函数
  const api = apiConfig
    ? {
        async list(params?: {
          page?: number;
          pageSize?: number;
          filters?: Record<string, unknown>;
          sorting?: DataState['sorting'];
        }) {
          const store = useStore.getState();
          store.setLoading(true);
          store.setError(null);

          try {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.set('page', params.page.toString());
            if (params?.pageSize)
              queryParams.set('pageSize', params.pageSize.toString());
            if (params?.filters) {
              Object.entries(params.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  queryParams.set(key, String(value));
                }
              });
            }
            if (params?.sorting) {
              queryParams.set('sortBy', params.sorting.field);
              queryParams.set('sortOrder', params.sorting.direction);
            }

            const url = `${apiConfig.baseUrl}${apiConfig.endpoints.list}?${queryParams}`;
            const response = await fetch(url, {
              headers: apiConfig.headers,
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const transformedData = apiConfig.transformResponse
              ? apiConfig.transformResponse(data)
              : data;

            store.setList(transformedData.items || transformedData);
            if (transformedData.pagination) {
              store.setPagination(transformedData.pagination);
            }
          } catch (error) {
            store.setError(
              error instanceof Error ? error.message : 'Unknown error'
            );
          } finally {
            store.setLoading(false);
          }
        },

        async create(data: Omit<T, 'id'>) {
          const store = useStore.getState();
          store.setLoading(true);
          store.setError(null);

          try {
            const requestData = apiConfig.transformRequest
              ? apiConfig.transformRequest(data)
              : data;

            const response = await fetch(
              `${apiConfig.baseUrl}${apiConfig.endpoints.create}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...apiConfig.headers,
                },
                body: JSON.stringify(requestData),
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            const transformedData = apiConfig.transformResponse
              ? apiConfig.transformResponse(responseData)
              : responseData;

            store.addItem(transformedData as T);
            return transformedData as T;
          } catch (error) {
            store.setError(
              error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
          } finally {
            store.setLoading(false);
          }
        },

        async read(id: string | number) {
          const store = useStore.getState();
          store.setLoading(true);
          store.setError(null);

          try {
            const url = `${apiConfig.baseUrl}${apiConfig.endpoints.read.replace(':id', String(id))}`;
            const response = await fetch(url, {
              headers: apiConfig.headers,
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const transformedData = apiConfig.transformResponse
              ? apiConfig.transformResponse(data)
              : data;

            store.setData(transformedData as T);
            return transformedData as T;
          } catch (error) {
            store.setError(
              error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
          } finally {
            store.setLoading(false);
          }
        },

        async update(id: string | number, updates: Partial<T>) {
          const store = useStore.getState();
          store.setLoading(true);
          store.setError(null);

          try {
            const requestData = apiConfig.transformRequest
              ? apiConfig.transformRequest(updates)
              : updates;

            const url = `${apiConfig.baseUrl}${apiConfig.endpoints.update.replace(':id', String(id))}`;
            const response = await fetch(url, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...apiConfig.headers,
              },
              body: JSON.stringify(requestData),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const transformedData = apiConfig.transformResponse
              ? apiConfig.transformResponse(data)
              : data;

            store.updateItem(id, transformedData as Partial<T>);
            return transformedData as T;
          } catch (error) {
            store.setError(
              error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
          } finally {
            store.setLoading(false);
          }
        },

        async delete(id: string | number) {
          const store = useStore.getState();
          store.setLoading(true);
          store.setError(null);

          try {
            const url = `${apiConfig.baseUrl}${apiConfig.endpoints.delete.replace(':id', String(id))}`;
            const response = await fetch(url, {
              method: 'DELETE',
              headers: apiConfig.headers,
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            store.removeItem(id);
          } catch (error) {
            store.setError(
              error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
          } finally {
            store.setLoading(false);
          }
        },
      }
    : null;

  return {
    useStore,
    api,
    name,
  };
}

// 预定义的数据管理器
export const userDataManager = createDataManager<{
  id: string;
  name: string;
  email: string;
  role: string;
}>('users');

export const projectDataManager = createDataManager<{
  id: string;
  name: string;
  description: string;
  status: string;
}>('projects');

// Hook 用于简化使用
export function useDataManager<T extends { id: string | number }>(
  manager: ReturnType<typeof createDataManager<T>>
) {
  const store = manager.useStore();

  return {
    ...store,
    api: manager.api,
    name: manager.name,
  };
}
