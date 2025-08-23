/**
 * 知识库状态管理 Slice
 * 管理知识项目、标签、筛选等状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 定义知识项目接口
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'video' | 'course' | 'tutorial' | 'documentation';
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'restricted';
  author: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
  views: number;
  likes: number;
  bookmarks: number;
  comments: number;
}

// 定义标签接口
export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

// 定义筛选选项接口
export interface FilterOptions {
  categories: string[];
  tags: string[];
  types: KnowledgeItem['type'][];
  difficulties: KnowledgeItem['difficulty'][];
  statuses: KnowledgeItem['status'][];
  visibilities: KnowledgeItem['visibility'][];
  dateRange: { start: string; end: string };
  ratingRange: [number, number];
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// 定义知识库状态接口
export interface KnowledgeBaseState {
  knowledgeItems: KnowledgeItem[];
  tags: Tag[];
  editingItem: KnowledgeItem | null;
  filterOptions: FilterOptions;
  selectedItems: string[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
}

// 初始状态
const initialState: KnowledgeBaseState = {
  knowledgeItems: [],
  tags: [],
  editingItem: null,
  filterOptions: {
    categories: [],
    tags: [],
    types: [],
    difficulties: [],
    statuses: [],
    visibilities: [],
    dateRange: { start: '', end: '' },
    ratingRange: [0, 5],
    searchQuery: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  selectedItems: [],
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  pageSize: 20,
};

// 异步 thunk - 获取知识项目列表
export const fetchKnowledgeItemsAsync = createAsyncThunk(
  'knowledgeBase/fetchKnowledgeItems',
  async (
    params: {
      page?: number;
      pageSize?: number;
      filters?: Partial<FilterOptions>;
    },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) {
        queryParams.append('pageSize', params.pageSize.toString());
      }

      const response = await fetch(`/api/knowledge?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('获取知识项目失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '获取知识项目失败'
      );
    }
  }
);

// 异步 thunk - 创建知识项目
export const createKnowledgeItemAsync = createAsyncThunk(
  'knowledgeBase/createKnowledgeItem',
  async (
    itemData: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error('创建知识项目失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '创建知识项目失败'
      );
    }
  }
);

// 异步 thunk - 更新知识项目
export const updateKnowledgeItemAsync = createAsyncThunk(
  'knowledgeBase/updateKnowledgeItem',
  async (
    { id, itemData }: { id: string; itemData: Partial<KnowledgeItem> },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error('更新知识项目失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '更新知识项目失败'
      );
    }
  }
);

// 异步 thunk - 删除知识项目
export const deleteKnowledgeItemAsync = createAsyncThunk(
  'knowledgeBase/deleteKnowledgeItem',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除知识项目失败');
      }

      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '删除知识项目失败'
      );
    }
  }
);

// 异步 thunk - 获取标签列表
export const fetchTagsAsync = createAsyncThunk(
  'knowledgeBase/fetchTags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/knowledge/tags');
      if (!response.ok) {
        throw new Error('获取标签失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '获取标签失败'
      );
    }
  }
);

// 创建 slice
const knowledgeBaseSlice = createSlice({
  name: 'knowledgeBase',
  initialState,
  reducers: {
    // 设置编辑项目
    setEditingItem: (state, action: PayloadAction<KnowledgeItem | null>) => {
      state.editingItem = action.payload;
    },

    // 设置筛选选项
    setFilterOptions: (
      state,
      action: PayloadAction<Partial<FilterOptions>>
    ) => {
      state.filterOptions = { ...state.filterOptions, ...action.payload };
      state.currentPage = 1; // 重置到第一页
    },

    // 设置搜索查询
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filterOptions.searchQuery = action.payload;
      state.currentPage = 1;
    },

    // 设置排序
    setSorting: (
      state,
      action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>
    ) => {
      state.filterOptions.sortBy = action.payload.sortBy;
      state.filterOptions.sortOrder = action.payload.sortOrder;
    },

    // 设置分页
    setPagination: (
      state,
      action: PayloadAction<{ page: number; pageSize: number }>
    ) => {
      state.currentPage = action.payload.page;
      state.pageSize = action.payload.pageSize;
    },

    // 选择项目
    selectItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (!state.selectedItems.includes(itemId)) {
        state.selectedItems.push(itemId);
      }
    },

    // 取消选择项目
    deselectItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.selectedItems = state.selectedItems.filter((id) => id !== itemId);
    },

    // 选择所有项目
    selectAllItems: (state) => {
      state.selectedItems = state.knowledgeItems.map((item) => item.id);
    },

    // 取消选择所有项目
    deselectAllItems: (state) => {
      state.selectedItems = [];
    },

    // 清除错误
    clearError: (state) => {
      state.error = null;
    },

    // 重置状态
    resetKnowledgeBase: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // 获取知识项目列表
    builder
      .addCase(fetchKnowledgeItemsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKnowledgeItemsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.knowledgeItems = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchKnowledgeItemsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 创建知识项目
    builder
      .addCase(createKnowledgeItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createKnowledgeItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.knowledgeItems.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createKnowledgeItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新知识项目
    builder
      .addCase(updateKnowledgeItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateKnowledgeItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.knowledgeItems.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.knowledgeItems[index] = action.payload;
        }
        if (state.editingItem?.id === action.payload.id) {
          state.editingItem = action.payload;
        }
      })
      .addCase(updateKnowledgeItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 删除知识项目
    builder
      .addCase(deleteKnowledgeItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteKnowledgeItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.knowledgeItems = state.knowledgeItems.filter(
          (item) => item.id !== action.payload
        );
        state.selectedItems = state.selectedItems.filter(
          (id) => id !== action.payload
        );
        state.total -= 1;
        if (state.editingItem?.id === action.payload) {
          state.editingItem = null;
        }
      })
      .addCase(deleteKnowledgeItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 获取标签列表
    builder
      .addCase(fetchTagsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTagsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = action.payload;
      })
      .addCase(fetchTagsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出 actions
export const {
  setEditingItem,
  setFilterOptions,
  setSearchQuery,
  setSorting,
  setPagination,
  selectItem,
  deselectItem,
  selectAllItems,
  deselectAllItems,
  clearError,
  resetKnowledgeBase,
} = knowledgeBaseSlice.actions;

// 导出 selectors
export const selectKnowledgeItems = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => state.knowledgeBase.knowledgeItems;

export const selectTags = (state: { knowledgeBase: KnowledgeBaseState }) =>
  state.knowledgeBase.tags;

export const selectEditingItem = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => state.knowledgeBase.editingItem;

export const selectFilterOptions = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => state.knowledgeBase.filterOptions;

export const selectSelectedItems = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => state.knowledgeBase.selectedItems;

export const selectKnowledgeBaseLoading = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => state.knowledgeBase.loading;

export const selectKnowledgeBaseError = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => state.knowledgeBase.error;

export const selectKnowledgeBasePagination = (state: {
  knowledgeBase: KnowledgeBaseState;
}) => ({
  currentPage: state.knowledgeBase.currentPage,
  pageSize: state.knowledgeBase.pageSize,
  total: state.knowledgeBase.total,
});

// 导出 reducer
export default knowledgeBaseSlice.reducer;
