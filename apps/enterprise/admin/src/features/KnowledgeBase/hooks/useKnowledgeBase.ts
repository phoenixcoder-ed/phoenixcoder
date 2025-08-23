import { useState, useCallback, useEffect, useMemo } from 'react';

// 知识项目类型定义
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'article' | 'note' | 'tutorial' | 'reference' | 'project';
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'team' | 'public';
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  rating: number;
  estimatedReadTime: number;
  prerequisites: string[];
  relatedItems: string[];
  attachments: Attachment[];
  comments: Comment[];
}

// 学习路径类型定义
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  skills: string[];
  prerequisites: string[];
  milestones: Milestone[];
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  enrolledCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  author: string;
}

// 里程碑类型定义
export interface Milestone {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  resources: Resource[];
  completedAt?: string;
  order: number;
}

// 资源类型定义
export interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'book' | 'course' | 'project' | 'documentation';
  url: string;
  description?: string;
  duration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isCompleted: boolean;
}

// 附件类型定义
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// 评论类型定义
export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies: Comment[];
}

// 分类类型定义
export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  itemCount: number;
  parentId?: string;
  children?: Category[];
}

// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  category: string;
}

// 筛选选项类型定义
export interface FilterOptions {
  categories: string[];
  tags: string[];
  types: string[];
  difficulties: string[];
  statuses: string[];
  visibilities: string[];
  dateRange: {
    start: string;
    end: string;
  };
  ratingRange: [number, number];
  searchQuery: string;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'rating' | 'viewCount';
  sortOrder: 'asc' | 'desc';
}

// 统计数据类型定义
export interface Statistics {
  totalItems: number;
  publishedItems: number;
  draftItems: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  averageRating: number;
  totalPaths: number;
  completedPaths: number;
  inProgressPaths: number;
  totalMilestones: number;
  completedMilestones: number;
  totalStudyHours: number;
  weeklyProgress: number[];
  categoryDistribution: { [key: string]: number };
  difficultyDistribution: { [key: string]: number };
}

// Hook 返回类型定义
export interface UseKnowledgeBaseReturn {
  // 数据状态
  knowledgeItems: KnowledgeItem[];
  learningPaths: LearningPath[];
  categories: Category[];
  tags: Tag[];
  statistics: Statistics;

  // UI 状态
  loading: boolean;
  error: string | null;
  filterOptions: FilterOptions;

  // 筛选和搜索
  filteredItems: KnowledgeItem[];
  filteredPaths: LearningPath[];

  // 知识项目操作
  createKnowledgeItem: (
    item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateKnowledgeItem: (
    id: string,
    updates: Partial<KnowledgeItem>
  ) => Promise<void>;
  deleteKnowledgeItem: (id: string) => Promise<void>;
  likeKnowledgeItem: (id: string) => Promise<void>;
  bookmarkKnowledgeItem: (id: string) => Promise<void>;
  viewKnowledgeItem: (id: string) => Promise<void>;

  // 学习路径操作
  createLearningPath: (
    path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateLearningPath: (
    id: string,
    updates: Partial<LearningPath>
  ) => Promise<void>;
  deleteLearningPath: (id: string) => Promise<void>;
  startLearningPath: (id: string) => Promise<void>;
  completeMilestone: (pathId: string, milestoneId: string) => Promise<void>;

  // 分类和标签操作
  createCategory: (
    category: Omit<Category, 'id' | 'itemCount'>
  ) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createTag: (tag: Omit<Tag, 'id' | 'usageCount'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // 筛选和排序
  updateFilterOptions: (updates: Partial<FilterOptions>) => void;
  resetFilters: () => void;

  // 数据管理
  refreshData: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (data: Record<string, unknown>) => Promise<void>;

  // 工具函数
  getItemById: (id: string) => KnowledgeItem | undefined;
  getPathById: (id: string) => LearningPath | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getTagById: (id: string) => Tag | undefined;
  getRelatedItems: (itemId: string) => KnowledgeItem[];
  getRecommendedPaths: (itemId: string) => LearningPath[];
}

// 默认筛选选项
const defaultFilterOptions: FilterOptions = {
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
};

// 知识库管理 Hook
export const useKnowledgeBase = (): UseKnowledgeBaseReturn => {
  // 状态管理
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(defaultFilterOptions);

  // 初始化数据
  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初始化模拟数据
  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟分类数据
      const mockCategories: Category[] = [
        {
          id: '1',
          name: '前端开发',
          description: '前端技术相关知识',
          color: '#2196F3',
          icon: '🎨',
          itemCount: 25,
          children: [
            {
              id: '1-1',
              name: 'React',
              description: 'React框架',
              color: '#61DAFB',
              icon: '⚛️',
              itemCount: 12,
              parentId: '1',
            },
            {
              id: '1-2',
              name: 'Vue',
              description: 'Vue框架',
              color: '#4FC08D',
              icon: '💚',
              itemCount: 8,
              parentId: '1',
            },
            {
              id: '1-3',
              name: 'TypeScript',
              description: 'TypeScript语言',
              color: '#3178C6',
              icon: '📘',
              itemCount: 5,
              parentId: '1',
            },
          ],
        },
        {
          id: '2',
          name: '后端开发',
          description: '后端技术相关知识',
          color: '#4CAF50',
          icon: '⚙️',
          itemCount: 18,
          children: [
            {
              id: '2-1',
              name: 'Node.js',
              description: 'Node.js技术',
              color: '#339933',
              icon: '🟢',
              itemCount: 10,
              parentId: '2',
            },
            {
              id: '2-2',
              name: 'Python',
              description: 'Python语言',
              color: '#3776AB',
              icon: '🐍',
              itemCount: 8,
              parentId: '2',
            },
          ],
        },
        {
          id: '3',
          name: '数据库',
          description: '数据库相关知识',
          color: '#FF9800',
          icon: '🗄️',
          itemCount: 12,
        },
        {
          id: '4',
          name: '算法与数据结构',
          description: '算法和数据结构',
          color: '#9C27B0',
          icon: '🧮',
          itemCount: 30,
        },
      ];

      // 模拟标签数据
      const mockTags: Tag[] = [
        {
          id: '1',
          name: 'JavaScript',
          color: '#F7DF1E',
          usageCount: 45,
          category: '编程语言',
        },
        {
          id: '2',
          name: 'React',
          color: '#61DAFB',
          usageCount: 32,
          category: '框架',
        },
        {
          id: '3',
          name: '性能优化',
          color: '#FF5722',
          usageCount: 28,
          category: '技术',
        },
        {
          id: '4',
          name: '最佳实践',
          color: '#4CAF50',
          usageCount: 25,
          category: '方法论',
        },
        {
          id: '5',
          name: '面试',
          color: '#E91E63',
          usageCount: 22,
          category: '职业发展',
        },
      ];

      // 模拟知识项目数据
      const mockItems: KnowledgeItem[] = [
        {
          id: '1',
          title: 'React Hooks 完全指南',
          content:
            '深入理解React Hooks的原理和最佳实践，包括useState、useEffect、useContext等核心Hook的使用方法和注意事项。',
          category: '1-1',
          tags: ['React', 'JavaScript', '最佳实践'],
          difficulty: 'intermediate',
          type: 'tutorial',
          status: 'published',
          visibility: 'public',
          author: '张三',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z',
          viewCount: 1250,
          likeCount: 89,
          bookmarkCount: 156,
          rating: 4.8,
          estimatedReadTime: 15,
          prerequisites: ['JavaScript基础', 'React基础'],
          relatedItems: ['2', '3'],
          attachments: [],
          comments: [],
        },
        {
          id: '2',
          title: 'TypeScript 高级类型系统',
          content:
            'TypeScript高级类型的使用技巧和实战案例，包括泛型、条件类型、映射类型等高级特性。',
          category: '1-3',
          tags: ['TypeScript', '类型系统'],
          difficulty: 'advanced',
          type: 'article',
          status: 'published',
          visibility: 'team',
          author: '李四',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T14:20:00Z',
          viewCount: 890,
          likeCount: 67,
          bookmarkCount: 123,
          rating: 4.6,
          estimatedReadTime: 20,
          prerequisites: ['TypeScript基础'],
          relatedItems: ['1'],
          attachments: [],
          comments: [],
        },
        {
          id: '3',
          title: '前端性能优化实战',
          content:
            '前端性能优化的策略和实施方案，包括代码分割、懒加载、缓存策略等实用技巧。',
          category: '1',
          tags: ['性能优化', 'JavaScript', '最佳实践'],
          difficulty: 'intermediate',
          type: 'project',
          status: 'draft',
          visibility: 'private',
          author: '王五',
          createdAt: '2024-01-12T11:00:00Z',
          updatedAt: '2024-01-22T16:45:00Z',
          viewCount: 0,
          likeCount: 0,
          bookmarkCount: 0,
          rating: 0,
          estimatedReadTime: 25,
          prerequisites: ['JavaScript基础', 'Web基础'],
          relatedItems: ['1'],
          attachments: [],
          comments: [],
        },
      ];

      // 模拟学习路径数据
      const mockPaths: LearningPath[] = [
        {
          id: '1',
          title: '全栈开发工程师',
          description: '从零开始学习全栈开发，掌握前端、后端、数据库等核心技术',
          category: '全栈开发',
          difficulty: 'intermediate',
          estimatedDuration: '6个月',
          skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
          prerequisites: ['JavaScript基础', 'HTML/CSS'],
          milestones: [
            {
              id: '1-1',
              title: '前端基础',
              description: '学习HTML、CSS、JavaScript基础知识',
              estimatedHours: 80,
              priority: 'high',
              status: 'completed',
              resources: [],
              order: 1,
              completedAt: '2024-01-15T10:00:00Z',
            },
            {
              id: '1-2',
              title: 'React框架',
              description: '深入学习React框架和生态系统',
              estimatedHours: 120,
              priority: 'high',
              status: 'in_progress',
              resources: [],
              order: 2,
            },
            {
              id: '1-3',
              title: 'Node.js后端',
              description: '学习Node.js后端开发',
              estimatedHours: 100,
              priority: 'medium',
              status: 'pending',
              resources: [],
              order: 3,
            },
          ],
          progress: 45,
          status: 'in_progress',
          enrolledCount: 1250,
          rating: 4.7,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-20T12:00:00Z',
          author: '系统管理员',
        },
      ];

      setCategories(mockCategories);
      setTags(mockTags);
      setKnowledgeItems(mockItems);
      setLearningPaths(mockPaths);
    } catch {
      setError('数据初始化失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 计算统计数据
  const statistics = useMemo((): Statistics => {
    const totalItems = knowledgeItems.length;
    const publishedItems = knowledgeItems.filter(
      (item) => item.status === 'published'
    ).length;
    const draftItems = knowledgeItems.filter(
      (item) => item.status === 'draft'
    ).length;
    const totalViews = knowledgeItems.reduce(
      (sum, item) => sum + item.viewCount,
      0
    );
    const totalLikes = knowledgeItems.reduce(
      (sum, item) => sum + item.likeCount,
      0
    );
    const totalBookmarks = knowledgeItems.reduce(
      (sum, item) => sum + item.bookmarkCount,
      0
    );
    const averageRating =
      knowledgeItems.length > 0
        ? knowledgeItems.reduce((sum, item) => sum + item.rating, 0) /
          knowledgeItems.length
        : 0;

    const totalPaths = learningPaths.length;
    const completedPaths = learningPaths.filter(
      (path) => path.status === 'completed'
    ).length;
    const inProgressPaths = learningPaths.filter(
      (path) => path.status === 'in_progress'
    ).length;

    const totalMilestones = learningPaths.reduce(
      (sum, path) => sum + path.milestones.length,
      0
    );
    const completedMilestones = learningPaths.reduce(
      (sum, path) =>
        sum +
        path.milestones.filter((milestone) => milestone.status === 'completed')
          .length,
      0
    );

    const totalStudyHours = learningPaths.reduce(
      (sum, path) =>
        sum +
        path.milestones.reduce(
          (milestoneSum, milestone) => milestoneSum + milestone.estimatedHours,
          0
        ),
      0
    );

    // 模拟周进度数据
    const weeklyProgress = [65, 72, 68, 75, 80, 78, 85];

    // 分类分布
    const categoryDistribution: { [key: string]: number } = {};
    knowledgeItems.forEach((item) => {
      const category = categories.find((cat) => cat.id === item.category);
      const categoryName = category?.name || '未分类';
      categoryDistribution[categoryName] =
        (categoryDistribution[categoryName] || 0) + 1;
    });

    // 难度分布
    const difficultyDistribution: { [key: string]: number } = {};
    knowledgeItems.forEach((item) => {
      difficultyDistribution[item.difficulty] =
        (difficultyDistribution[item.difficulty] || 0) + 1;
    });

    return {
      totalItems,
      publishedItems,
      draftItems,
      totalViews,
      totalLikes,
      totalBookmarks,
      averageRating,
      totalPaths,
      completedPaths,
      inProgressPaths,
      totalMilestones,
      completedMilestones,
      totalStudyHours,
      weeklyProgress,
      categoryDistribution,
      difficultyDistribution,
    };
  }, [knowledgeItems, learningPaths, categories]);

  // 筛选知识项目
  const filteredItems = useMemo(() => {
    let filtered = [...knowledgeItems];

    // 搜索过滤
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (filterOptions.categories.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.categories.includes(item.category)
      );
    }

    // 标签过滤
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.tags.some((tag) => item.tags.includes(tag))
      );
    }

    // 类型过滤
    if (filterOptions.types.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.types.includes(item.type)
      );
    }

    // 难度过滤
    if (filterOptions.difficulties.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.difficulties.includes(item.difficulty)
      );
    }

    // 状态过滤
    if (filterOptions.statuses.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.statuses.includes(item.status)
      );
    }

    // 可见性过滤
    if (filterOptions.visibilities.length > 0) {
      filtered = filtered.filter((item) =>
        filterOptions.visibilities.includes(item.visibility)
      );
    }

    // 评分过滤
    filtered = filtered.filter(
      (item) =>
        item.rating >= filterOptions.ratingRange[0] &&
        item.rating <= filterOptions.ratingRange[1]
    );

    // 排序
    filtered.sort((a, b) => {
      const aValue = a[filterOptions.sortBy];
      const bValue = b[filterOptions.sortBy];

      if (filterOptions.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [knowledgeItems, filterOptions]);

  // 筛选学习路径
  const filteredPaths = useMemo(() => {
    let filtered = [...learningPaths];

    // 搜索过滤
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (path) =>
          path.title.toLowerCase().includes(query) ||
          path.description.toLowerCase().includes(query) ||
          path.skills.some((skill) => skill.toLowerCase().includes(query))
      );
    }

    // 难度过滤
    if (filterOptions.difficulties.length > 0) {
      filtered = filtered.filter((path) =>
        filterOptions.difficulties.includes(path.difficulty)
      );
    }

    return filtered;
  }, [learningPaths, filterOptions]);

  // 知识项目操作
  const createKnowledgeItem = useCallback(
    async (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      try {
        const newItem: KnowledgeItem = {
          ...item,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setKnowledgeItems((prev) => [...prev, newItem]);
      } catch {
        setError('创建知识项目失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateKnowledgeItem = useCallback(
    async (id: string, updates: Partial<KnowledgeItem>) => {
      setLoading(true);
      try {
        setKnowledgeItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          )
        );
      } catch {
        setError('更新知识项目失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteKnowledgeItem = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setKnowledgeItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError('删除知识项目失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const likeKnowledgeItem = useCallback(async (id: string) => {
    try {
      setKnowledgeItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, likeCount: item.likeCount + 1 } : item
        )
      );
    } catch {
      setError('点赞失败');
    }
  }, []);

  const bookmarkKnowledgeItem = useCallback(async (id: string) => {
    try {
      setKnowledgeItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, bookmarkCount: item.bookmarkCount + 1 }
            : item
        )
      );
    } catch {
      setError('收藏失败');
    }
  }, []);

  const viewKnowledgeItem = useCallback(async (id: string) => {
    try {
      setKnowledgeItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, viewCount: item.viewCount + 1 } : item
        )
      );
    } catch {
      setError('记录浏览失败');
    }
  }, []);

  // 学习路径操作
  const createLearningPath = useCallback(
    async (path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      try {
        const newPath: LearningPath = {
          ...path,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLearningPaths((prev) => [...prev, newPath]);
      } catch {
        setError('创建学习路径失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateLearningPath = useCallback(
    async (id: string, updates: Partial<LearningPath>) => {
      setLoading(true);
      try {
        setLearningPaths((prev) =>
          prev.map((path) =>
            path.id === id
              ? { ...path, ...updates, updatedAt: new Date().toISOString() }
              : path
          )
        );
      } catch {
        setError('更新学习路径失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteLearningPath = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setLearningPaths((prev) => prev.filter((path) => path.id !== id));
    } catch {
      setError('删除学习路径失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const startLearningPath = useCallback(async (id: string) => {
    try {
      setLearningPaths((prev) =>
        prev.map((path) =>
          path.id === id
            ? {
                ...path,
                status: 'in_progress',
                updatedAt: new Date().toISOString(),
              }
            : path
        )
      );
    } catch {
      setError('开始学习路径失败');
    }
  }, []);

  const completeMilestone = useCallback(
    async (pathId: string, milestoneId: string) => {
      try {
        setLearningPaths((prev) =>
          prev.map((path) => {
            if (path.id === pathId) {
              const updatedMilestones = path.milestones.map((milestone) =>
                milestone.id === milestoneId
                  ? {
                      ...milestone,
                      status: 'completed' as const,
                      completedAt: new Date().toISOString(),
                    }
                  : milestone
              );
              const completedCount = updatedMilestones.filter(
                (m) => m.status === 'completed'
              ).length;
              const progress = Math.round(
                (completedCount / updatedMilestones.length) * 100
              );

              return {
                ...path,
                milestones: updatedMilestones,
                progress,
                status: progress === 100 ? ('completed' as const) : path.status,
                updatedAt: new Date().toISOString(),
              };
            }
            return path;
          })
        );
      } catch {
        setError('完成里程碑失败');
      }
    },
    []
  );

  // 分类和标签操作
  const createCategory = useCallback(
    async (category: Omit<Category, 'id' | 'itemCount'>) => {
      setLoading(true);
      try {
        const newCategory: Category = {
          ...category,
          id: Date.now().toString(),
          itemCount: 0,
        };
        setCategories((prev) => [...prev, newCategory]);
      } catch {
        setError('创建分类失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      setLoading(true);
      try {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === id ? { ...category, ...updates } : category
          )
        );
      } catch {
        setError('更新分类失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch {
      setError('删除分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (tag: Omit<Tag, 'id' | 'usageCount'>) => {
    setLoading(true);
    try {
      const newTag: Tag = {
        ...tag,
        id: Date.now().toString(),
        usageCount: 0,
      };
      setTags((prev) => [...prev, newTag]);
    } catch {
      setError('创建标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    setLoading(true);
    try {
      setTags((prev) =>
        prev.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag))
      );
    } catch {
      setError('更新标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setTags((prev) => prev.filter((tag) => tag.id !== id));
    } catch {
      setError('删除标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 筛选和排序
  const updateFilterOptions = useCallback((updates: Partial<FilterOptions>) => {
    setFilterOptions((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterOptions(defaultFilterOptions);
  }, []);

  // 数据管理
  const refreshData = useCallback(async () => {
    await initializeData();
  }, [initializeData]);

  const exportData = useCallback(async () => {
    try {
      const data = {
        knowledgeItems,
        learningPaths,
        categories,
        tags,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-base-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('导出数据失败');
    }
  }, [knowledgeItems, learningPaths, categories, tags]);

  const importData = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      if (data.knowledgeItems && Array.isArray(data.knowledgeItems)) {
        setKnowledgeItems(data.knowledgeItems as KnowledgeItem[]);
      }
      if (data.learningPaths && Array.isArray(data.learningPaths)) {
        setLearningPaths(data.learningPaths as LearningPath[]);
      }
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories as Category[]);
      }
      if (data.tags && Array.isArray(data.tags)) {
        setTags(data.tags as Tag[]);
      }
    } catch {
      setError('导入数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 工具函数
  const getItemById = useCallback(
    (id: string) => {
      return knowledgeItems.find((item) => item.id === id);
    },
    [knowledgeItems]
  );

  const getPathById = useCallback(
    (id: string) => {
      return learningPaths.find((path) => path.id === id);
    },
    [learningPaths]
  );

  const getCategoryById = useCallback(
    (id: string) => {
      return categories.find((category) => category.id === id);
    },
    [categories]
  );

  const getTagById = useCallback(
    (id: string) => {
      return tags.find((tag) => tag.id === id);
    },
    [tags]
  );

  const getRelatedItems = useCallback(
    (itemId: string) => {
      const item = getItemById(itemId);
      if (!item) return [];

      return knowledgeItems.filter((relatedItem) =>
        item.relatedItems.includes(relatedItem.id)
      );
    },
    [knowledgeItems, getItemById]
  );

  const getRecommendedPaths = useCallback(
    (itemId: string) => {
      const item = getItemById(itemId);
      if (!item) return [];

      // 基于标签和分类推荐相关学习路径
      return learningPaths.filter(
        (path) =>
          path.skills.some((skill) => item.tags.includes(skill)) ||
          path.category === item.category
      );
    },
    [learningPaths, getItemById]
  );

  return {
    // 数据状态
    knowledgeItems,
    learningPaths,
    categories,
    tags,
    statistics,

    // UI 状态
    loading,
    error,
    filterOptions,

    // 筛选和搜索
    filteredItems,
    filteredPaths,

    // 知识项目操作
    createKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    likeKnowledgeItem,
    bookmarkKnowledgeItem,
    viewKnowledgeItem,

    // 学习路径操作
    createLearningPath,
    updateLearningPath,
    deleteLearningPath,
    startLearningPath,
    completeMilestone,

    // 分类和标签操作
    createCategory,
    updateCategory,
    deleteCategory,
    createTag,
    updateTag,
    deleteTag,

    // 筛选和排序
    updateFilterOptions,
    resetFilters,

    // 数据管理
    refreshData,
    exportData,
    importData,

    // 工具函数
    getItemById,
    getPathById,
    getCategoryById,
    getTagById,
    getRelatedItems,
    getRecommendedPaths,
  };
};
