// 文章类型接口
export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
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
