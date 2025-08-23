import api from '@/features/auth/api';

// 定义文章类型接口
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

// 定义创建文章请求接口
export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: string;
}

// 定义更新文章请求接口
export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  category?: string;
}

// 获取文章列表，支持筛选和分页
export const getArticles = async (
  category?: string,
  tag?: string,
  limit: number = 10,
  offset: number = 0
): Promise<Article[]> => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get<Article[]>(`/articles?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(
      '获取文章列表失败: ' +
        (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 获取单个文章
export const getArticle = async (articleId: string): Promise<Article> => {
  try {
    const response = await api.get<Article>(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      '获取文章详情失败: ' +
        (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 创建文章
export const createArticle = async (
  articleData: CreateArticleRequest
): Promise<Article> => {
  try {
    const response = await api.post<Article>('/articles', articleData);
    return response.data;
  } catch (error) {
    throw new Error(
      '创建文章失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 更新文章
export const updateArticle = async (
  articleId: string,
  articleData: UpdateArticleRequest
): Promise<Article> => {
  try {
    const response = await api.put<Article>(
      `/articles/${articleId}`,
      articleData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      '更新文章失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};

// 删除文章
export const deleteArticle = async (articleId: string): Promise<void> => {
  try {
    await api.delete(`/articles/${articleId}`);
  } catch (error) {
    throw new Error(
      '删除文章失败: ' + (error instanceof Error ? error.message : '未知错误')
    );
  }
};
