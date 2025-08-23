"""
用户管理API

提供用户管理相关的API接口，包括：
- 用户信息查询
- 用户信息更新
- 用户列表
- 用户统计
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr

from repositories.user_repository import UserRepository
from services.auth_service import AuthService
from shared.container import get_user_repository, get_auth_service
from shared.exceptions import UserNotFoundError, ValidationError, AuthorizationError

router = APIRouter()
security = HTTPBearer()


# 请求模型
class UpdateUserRequest(BaseModel):
    """更新用户信息请求"""
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="用户名")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")
    avatar_url: Optional[str] = Field(None, description="头像URL")
    bio: Optional[str] = Field(None, max_length=500, description="个人简介")
    location: Optional[str] = Field(None, max_length=100, description="所在地")
    website: Optional[str] = Field(None, description="个人网站")
    github_username: Optional[str] = Field(None, description="GitHub用户名")


class UpdateUserStatusRequest(BaseModel):
    """更新用户状态请求"""
    is_active: bool = Field(..., description="是否激活")
    reason: Optional[str] = Field(None, description="操作原因")


# 响应模型
class UserResponse(BaseModel):
    """用户响应"""
    id: str
    username: str
    email: str
    phone: Optional[str]
    user_type: str
    isActive: bool
    is_verified: bool
    avatarUrl: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    website: Optional[str]
    github_username: Optional[str]
    createdAt: str
    updatedAt: str
    last_login_at: Optional[str]


class UserListResponse(BaseModel):
    """用户列表响应"""
    users: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int


class UserStatsResponse(BaseModel):
    """用户统计响应"""
    total_users: int
    active_users: int
    verified_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    user_types: dict


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> int:
    """获取当前用户ID"""
    try:
        user_info = await auth_service.verify_access_token(credentials.credentials)
        return user_info["user_id"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌"
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="获取当前用户信息",
    description="获取当前认证用户的详细信息"
)
async def get_current_user_profile(
    current_user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserResponse:
    """
    获取当前用户信息
    
    返回当前认证用户的详细信息
    """
    try:
        user = await user_repo.get_by_id(current_user_id)
        if not user:
            raise UserNotFoundError("用户不存在")
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            phone=user.phone,
            user_type=user.user_type,
            is_active=user.is_active,
            is_verified=user.is_verified,
            avatar_url=user.avatar_url,
            bio=user.bio,
            location=user.location,
            website=user.website,
            github_username=user.github_username,
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat(),
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/me",
    response_model=UserResponse,
    summary="更新当前用户信息",
    description="更新当前认证用户的信息"
)
async def update_current_user_profile(
    request: UpdateUserRequest,
    current_user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserResponse:
    """
    更新当前用户信息
    
    更新当前认证用户的个人信息
    """
    try:
        # 准备更新数据
        update_data = {}
        for field, value in request.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if not update_data:
            raise ValidationError("没有提供要更新的数据")
        
        # 检查用户名和邮箱唯一性
        if "username" in update_data:
            existing_user = await user_repo.get_by_username(update_data["username"])
            if existing_user and existing_user.id != current_user_id:
                raise ValidationError("用户名已存在")
        
        if "email" in update_data:
            existing_user = await user_repo.get_by_email(update_data["email"])
            if existing_user and existing_user.id != current_user_id:
                raise ValidationError("邮箱已存在")
        
        # 更新用户信息
        user = await user_repo.update(current_user_id, update_data)
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            phone=user.phone,
            user_type=user.user_type,
            is_active=user.is_active,
            is_verified=user.is_verified,
            avatar_url=user.avatar_url,
            bio=user.bio,
            location=user.location,
            website=user.website,
            github_username=user.github_username,
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat(),
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="获取用户信息",
    description="根据用户ID获取用户信息"
)
async def get_user_by_id(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserResponse:
    """
    获取用户信息
    
    根据用户ID获取用户的公开信息
    """
    try:
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("用户不存在")
        
        # 如果不是查看自己的信息，只返回公开信息
        if user_id != current_user_id:
            # 隐藏敏感信息
            phone = None
            email = user.email if user.is_verified else None
        else:
            phone = user.phone
            email = user.email
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=email,
            phone=phone,
            user_type=user.user_type,
            is_active=user.is_active,
            is_verified=user.is_verified,
            avatar_url=user.avatar_url,
            bio=user.bio,
            location=user.location,
            website=user.website,
            github_username=user.github_username,
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat(),
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=UserListResponse,
    summary="获取用户列表",
    description="获取用户列表（管理员功能）"
)
async def get_users(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    user_type: Optional[str] = Query(None, description="用户类型"),
    is_active: Optional[bool] = Query(None, description="是否激活"),
    current_user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserListResponse:
    """
    获取用户列表
    
    管理员可以查看所有用户列表，支持分页和筛选
    """
    try:
        # 检查当前用户是否为管理员
        current_user = await user_repo.get_by_id(current_user_id)
        if not current_user or current_user.user_type != "admin":
            raise AuthorizationError("权限不足")
        
        # 构建筛选条件
        filters = {}
        if user_type:
            filters["user_type"] = user_type
        if is_active is not None:
            filters["is_active"] = is_active
        
        # 获取用户列表
        users, total = await user_repo.list_users(
            page=page,
            size=size,
            search=search,
            filters=filters
        )
        
        # 转换为响应模型
        user_responses = []
        for user in users:
            user_responses.append(UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                phone=user.phone,
                user_type=user.user_type,
                is_active=user.is_active,
                is_verified=user.is_verified,
                avatar_url=user.avatar_url,
                bio=user.bio,
                location=user.location,
                website=user.website,
                github_username=user.github_username,
                created_at=user.created_at.isoformat(),
                updated_at=user.updated_at.isoformat(),
                last_login_at=user.last_login_at.isoformat() if user.last_login_at else None
            ))
        
        pages = (total + size - 1) // size
        
        return UserListResponse(
            users=user_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get(
    "/stats/overview",
    response_model=UserStatsResponse,
    summary="获取用户统计",
    description="获取用户统计信息（管理员功能）"
)
async def get_user_stats(
    current_user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserStatsResponse:
    """
    获取用户统计
    
    管理员可以查看用户统计信息
    """
    try:
        # 检查当前用户是否为管理员
        current_user = await user_repo.get_by_id(current_user_id)
        if not current_user or current_user.user_type != "admin":
            raise AuthorizationError("权限不足")
        
        # 获取统计信息
        stats = await user_repo.get_user_stats()
        
        return UserStatsResponse(**stats)
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put(
    "/{user_id}/status",
    summary="更新用户状态",
    description="更新用户状态（管理员功能）"
)
async def update_user_status(
    user_id: int,
    request: UpdateUserStatusRequest,
    current_user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository)
) -> dict:
    """
    更新用户状态
    
    管理员可以激活或停用用户账户
    """
    try:
        # 检查当前用户是否为管理员
        current_user = await user_repo.get_by_id(current_user_id)
        if not current_user or current_user.user_type != "admin":
            raise AuthorizationError("权限不足")
        
        # 不能操作自己的账户
        if user_id == current_user_id:
            raise ValidationError("不能操作自己的账户")
        
        # 更新用户状态
        if request.is_active:
            await user_repo.activate_user(user_id)
            message = "用户已激活"
        else:
            await user_repo.deactivate_user(user_id, request.reason)
            message = "用户已停用"
        
        return {"message": message}
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )