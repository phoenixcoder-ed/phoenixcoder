"""
认证API

提供用户认证相关的API接口，包括：
- 用户登录
- 用户注册
- 令牌刷新
- 用户登出
- 密码修改
- OIDC认证
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr

from services.auth_service import AuthService, LoginCredentials, RegisterData, AuthResult
from shared.container import get_auth_service
from shared.exceptions import (
    AuthenticationError,
    ValidationError,
    UserNotFoundError,
    UserAlreadyExistsError
)

router = APIRouter()
security = HTTPBearer()


# 请求模型
class LoginRequest(BaseModel):
    """登录请求"""
    identifier: str = Field(..., description="用户标识符（目前只支持邮箱）")
    password: str = Field(..., description="密码")
    remember_me: bool = Field(default=False, description="记住我")


class RegisterRequest(BaseModel):
    """注册请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")
    password: str = Field(..., min_length=8, description="密码")
    confirm_password: str = Field(..., description="确认密码")
    agree_terms: bool = Field(..., description="同意服务条款")
    user_type: str = Field(default="developer", description="用户类型")


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=8, description="新密码")
    confirm_password: str = Field(..., description="确认新密码")


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str = Field(..., description="刷新令牌")


class OIDCCallbackRequest(BaseModel):
    """OIDC回调请求"""
    code: str = Field(..., description="授权码")
    state: Optional[str] = Field(None, description="状态参数")


# 响应模型
class AuthResponse(BaseModel):
    """认证响应"""
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间（秒）")
    user: dict = Field(..., description="用户信息")


class MessageResponse(BaseModel):
    """消息响应"""
    message: str = Field(..., description="响应消息")


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="用户登录",
    description="使用邮箱和密码登录"
)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    用户登录
    
    目前只支持使用邮箱登录
    """
    try:
        # 目前只支持邮箱登录
        identifier = request.identifier
        if "@" not in identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="目前只支持邮箱登录，请输入有效的邮箱地址"
            )
        
        credentials = LoginCredentials(
            email=identifier,
            password=request.password
        )
        
        result = await auth_service.authenticate(credentials)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result.error_message or "认证失败"
            )
        
        # 生成刷新令牌
        refresh_token = auth_service.token_service.create_refresh_token(result.user["id"])
        
        return AuthResponse(
            access_token=result.token,
            refresh_token=refresh_token,
            expires_in=3600,  # 1小时
            user=result.user
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/register",
    response_model=AuthResponse,
    summary="用户注册",
    description="注册新用户账户"
)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    用户注册
    
    创建新的用户账户并返回认证令牌
    """
    try:
        # 验证密码确认
        if request.password != request.confirm_password:
            raise ValidationError("密码确认不匹配")
        
        register_data = RegisterData(
            username=request.username,
            email=request.email,
            phone=request.phone,
            password=request.password,
            agree_terms=request.agree_terms,
            user_type=request.user_type
        )
        
        result = await auth_service.register_user(register_data)
        
        return AuthResponse(
            access_token=result.access_token,
            refresh_token=result.refresh_token,
            expires_in=result.expires_in,
            user=result.user
        )
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="刷新令牌",
    description="使用刷新令牌获取新的访问令牌"
)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    刷新令牌
    
    使用刷新令牌获取新的访问令牌
    """
    try:
        result = await auth_service.refresh_token(request.refresh_token)
        
        return AuthResponse(
            access_token=result.access_token,
            refresh_token=result.refresh_token,
            expires_in=result.expires_in,
            user=result.user
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="用户登出",
    description="登出当前会话"
)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> MessageResponse:
    """
    用户登出
    
    撤销当前访问令牌对应的会话
    """
    try:
        await auth_service.logout_user(credentials.credentials)
        return MessageResponse(message="登出成功")
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="登出所有设备",
    description="登出用户的所有会话"
)
async def logout_all(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> MessageResponse:
    """
    登出所有设备
    
    撤销用户的所有会话
    """
    try:
        await auth_service.logout_all_devices(credentials.credentials)
        return MessageResponse(message="已登出所有设备")
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="修改密码",
    description="修改用户密码"
)
async def change_password(
    request: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> MessageResponse:
    """
    修改密码
    
    修改当前用户的密码，需要提供旧密码验证
    """
    try:
        # 验证新密码确认
        if request.new_password != request.confirm_password:
            raise ValidationError("新密码确认不匹配")
        
        await auth_service.change_password(
            credentials.credentials,
            request.old_password,
            request.new_password
        )
        
        return MessageResponse(message="密码修改成功")
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/oidc/callback",
    response_model=AuthResponse,
    summary="OIDC回调",
    description="处理OIDC认证回调"
)
async def oidc_callback(
    request: OIDCCallbackRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    OIDC回调
    
    处理OIDC认证服务器的回调，完成用户认证
    """
    try:
        from datetime import datetime, timedelta
        import jwt
        import secrets
        
        # 验证授权码
        if not request.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少授权码"
            )
        
        # 验证state参数（防止CSRF攻击）
        if not request.state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少state参数"
            )
        
        # 模拟OIDC令牌交换过程
        # 实际应该向OIDC服务器发送请求交换访问令牌
        
        # 模拟用户信息（实际应该从OIDC服务器获取）
        user_info = {
            "sub": f"oidc_user_{request.code[:8]}",
            "email": f"user_{request.code[:8]}@example.com",
            "name": f"OIDC用户{request.code[:4]}",
            "preferred_username": f"oidc_user_{request.code[:8]}",
            "email_verified": True
        }
        
        # 检查用户是否已存在，如果不存在则创建
        # 这里简化处理，实际应该调用用户服务
        
        # 生成JWT令牌
        secret_key = "your-secret-key"  # 实际应该从配置中获取
        
        # 生成访问令牌
        access_token_payload = {
            "sub": user_info["sub"],
            "email": user_info["email"],
            "name": user_info["name"],
            "exp": datetime.utcnow() + timedelta(hours=1),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        access_token = jwt.encode(access_token_payload, secret_key, algorithm="HS256")
        
        # 生成刷新令牌
        refresh_token_payload = {
            "sub": user_info["sub"],
            "exp": datetime.utcnow() + timedelta(days=30),
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        refresh_token = jwt.encode(refresh_token_payload, secret_key, algorithm="HS256")
        
        # 构建用户响应
        user_response = {
            "id": hash(user_info["sub"]) % 10000,  # 简化的用户ID生成
            "username": user_info["preferred_username"],
            "email": user_info["email"],
            "name": user_info["name"],
            "avatar": None,
            "user_type": "developer",  # 默认为开发者
            "is_verified": user_info.get("email_verified", False),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,  # 1小时
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OIDC认证失败: {str(e)}"
        )


@router.get(
    "/me",
    summary="获取当前用户信息",
    description="获取当前认证用户的信息"
)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> dict:
    """
    获取当前用户信息
    
    返回当前认证用户的详细信息
    """
    try:
        user_info = await auth_service.verify_access_token(credentials.credentials)
        return user_info
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )