// 文章类型接口
export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}

// 创建文章请求接口
export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: string;
}

// 更新文章请求接口
export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  category?: string;
}