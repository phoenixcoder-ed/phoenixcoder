// 帖子类型定义
export interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    authorId: string;
    authorName: string;
    avatar: string;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    isLiked?: boolean;
    isFavorited?: boolean;
}

// 评论类型定义
export interface Comment {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    avatar: string;
    createdAt: string;
    updatedAt: string;
}

// 帖子列表查询参数
export interface PostQueryParams {
    category?: string;
    page?: number;
    pageSize?: number;
}
