// 搜索结果类型
export interface SearchResult {
    id: string;
    title: string;
    summary: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    readTime: number; // 阅读时间（分钟）
}

// 知识条目类型
export interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    readTime: number;
    author: string;
    publishDate: string;
    views: number;
    likes: number;
}

// 知识分类类型
export interface KnowledgeCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
}

// 搜索参数类型
export interface SearchParams {
    query: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
}

// 知识状态类型
export interface KnowledgeState {
    searchResults: SearchResult[];
    currentKnowledge: KnowledgeEntry | null;
    categories: KnowledgeCategory[];
    loading: boolean;
    error: string | null;
    searchHistory: string[];
    hotTopics: string[];
}
