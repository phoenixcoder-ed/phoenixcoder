from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi.security import OAuth2AuthorizationCodeBearer
from config.settings import settings

router = APIRouter()
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{settings.oidc.issuer}/authorize",
    tokenUrl=f"{settings.oidc.issuer}/token"
)

# 定义知识库文章模型
class ArticleModel(BaseModel):
    id: str
    title: str
    content: str
    summary: Optional[str] = None
    tags: List[str]
    category: str
    author_id: str
    created_at: str
    updated_at: str
    view_count: int

# 定义创建文章请求模型
class CreateArticleRequest(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    tags: List[str]
    category: str

# 定义更新文章请求模型
class UpdateArticleRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None

@router.get("/articles", response_model=List[ArticleModel])
async def get_articles(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    token: str = Depends(oauth2_scheme)
):
    """获取知识库文章列表，支持筛选"""
    # 实际应用中应该查询数据库
    # 这里模拟获取文章列表
    articles = [
        {
            "id": "1",
            "title": "FastAPI入门指南",
            "content": "FastAPI是一个现代化的、高性能的Web框架...",
            "summary": "本文介绍了FastAPI的基本使用方法。",
            "tags": ["FastAPI", "Python", "Web框架"],
            "category": "后端开发",
            "author_id": "1",
            "created_at": "2023-01-01T12:00:00Z",
            "updated_at": "2023-01-01T12:00:00Z",
            "view_count": 100
        },
        {
            "id": "2",
            "title": "React Hooks详解",
            "content": "React Hooks是React 16.8引入的新特性...",
            "summary": "本文详细讲解了React Hooks的使用场景和注意事项。",
            "tags": ["React", "Hooks", "前端开发"],
            "category": "前端开发",
            "author_id": "2",
            "created_at": "2023-01-02T12:00:00Z",
            "updated_at": "2023-01-02T12:00:00Z",
            "view_count": 80
        },
        {
            "id": "3",
            "title": "Docker容器化实践",
            "content": "Docker是一个开源的应用容器引擎...",
            "summary": "本文介绍了如何使用Docker进行应用容器化。",
            "tags": ["Docker", "容器化", "DevOps"],
            "category": "DevOps",
            "author_id": "3",
            "created_at": "2023-01-03T12:00:00Z",
            "updated_at": "2023-01-03T12:00:00Z",
            "view_count": 120
        }
    ]

    # 应用筛选
    if category:
        articles = [a for a in articles if a["category"] == category]
    if tag:
        articles = [a for a in articles if tag in a["tags"]]

    # 应用分页
    articles = articles[offset:offset+limit]

    return articles

@router.get("/articles/{article_id}", response_model=ArticleModel)
async def get_article(article_id: str, token: str = Depends(oauth2_scheme)):
    """获取指定文章详情"""
    # 实际应用中应该查询数据库
    # 这里模拟获取文章
    articles = await get_articles(token=token)
    for article in articles:
        if article["id"] == article_id:
            # 模拟增加浏览量
            article["view_count"] += 1
            return article
    raise HTTPException(status_code=404, detail="文章不存在")

@router.post("/articles", response_model=ArticleModel)
async def create_article(article_data: CreateArticleRequest, token: str = Depends(oauth2_scheme)):
    """创建新文章"""
    # 实际应用中应该检查权限和保存到数据库
    # 这里模拟创建文章
    # 从token中获取作者ID（实际应用中应该解码token）
    author_id = "1"

    new_article = {
        "id": "4",  # 实际应用中应该自动生成
        "title": article_data.title,
        "content": article_data.content,
        "summary": article_data.summary,
        "tags": article_data.tags,
        "category": article_data.category,
        "author_id": author_id,
        "created_at": "2023-01-04T12:00:00Z",
        "updated_at": "2023-01-04T12:00:00Z",
        "view_count": 0
    }
    return new_article

@router.put("/articles/{article_id}", response_model=ArticleModel)
async def update_article(article_id: str, article_data: UpdateArticleRequest, token: str = Depends(oauth2_scheme)):
    """更新文章信息"""
    # 实际应用中应该查询并更新数据库
    # 这里模拟更新文章
    articles = await get_articles(token=token)
    for article in articles:
        if article["id"] == article_id:
            # 实际应用中应该检查权限
            if article_data.title is not None:
                article["title"] = article_data.title
            if article_data.content is not None:
                article["content"] = article_data.content
            if article_data.summary is not None:
                article["summary"] = article_data.summary
            if article_data.tags is not None:
                article["tags"] = article_data.tags
            if article_data.category is not None:
                article["category"] = article_data.category
            article["updated_at"] = "2023-01-05T12:00:00Z"
            return article
    raise HTTPException(status_code=404, detail="文章不存在")

@router.delete("/articles/{article_id}")
async def delete_article(article_id: str, token: str = Depends(oauth2_scheme)):
    """删除文章"""
    # 实际应用中应该查询并删除数据库中的文章
    # 这里模拟删除文章
    return {"message": "文章删除成功"}