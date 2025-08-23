"""
认证中间件

提供JWT令牌验证和用户认证功能
"""

import time
from typing import Optional, Set
from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from services.auth_service import AuthService
from shared.container import get_auth_service
from shared.exceptions import AuthenticationError, AuthorizationError
from config.settings import get_settings

settings = get_settings()


class AuthMiddleware(BaseHTTPMiddleware):
    """认证中间件"""
    
    def __init__(self, app, exclude_paths: Optional[Set[str]] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or {
            "/",
            "/health",  # 添加根级别健康检查端点
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/health",
            "/api/v1/health/live",
            "/api/v1/health/ready",
            "/api/v1/health/metrics",
            "/api/validation/health",  # 添加验证演示的健康检查端点
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/oidc/login",
            "/api/v1/auth/oidc/callback",
        }
    
    async def dispatch(self, request: Request, call_next):
        """处理请求"""
        start_time = time.time()
        
        # 检查是否需要认证
        if self._should_skip_auth(request):
            response = await call_next(request)
            return response
        
        # 提取并验证令牌
        try:
            token = self._extract_token(request)
            if not token:
                return self._unauthorized_response("缺少访问令牌")
            
            # 验证令牌
            auth_service = get_auth_service()
            user_info = await auth_service.verify_access_token(token)
            
            # 将用户信息添加到请求状态
            request.state.user_id = user_info["user_id"]
            request.state.username = user_info["username"]
            request.state.user_role = user_info.get("role", "user")
            request.state.session_id = user_info.get("session_id")
            
            # 继续处理请求
            response = await call_next(request)
            
            # 添加处理时间头
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except AuthenticationError as e:
            return self._unauthorized_response(str(e))
        except AuthorizationError as e:
            return self._forbidden_response(str(e))
        except Exception as e:
            return self._unauthorized_response("令牌验证失败")
    
    def _should_skip_auth(self, request: Request) -> bool:
        """检查是否应该跳过认证"""
        path = request.url.path
        
        # 检查排除路径
        if path in self.exclude_paths:
            return True
        
        # 检查路径前缀
        skip_prefixes = ["/static/", "/favicon.ico"]
        for prefix in skip_prefixes:
            if path.startswith(prefix):
                return True
        
        return False
    
    def _extract_token(self, request: Request) -> Optional[str]:
        """从请求中提取令牌"""
        # 从Authorization头提取
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header[7:]  # 移除 "Bearer " 前缀
        
        # 从查询参数提取（不推荐，仅用于特殊情况）
        token = request.query_params.get("token")
        if token:
            return token
        
        return None
    
    def _unauthorized_response(self, message: str) -> JSONResponse:
        """返回401未授权响应"""
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": "unauthorized",
                "message": message,
                "timestamp": time.time()
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    def _forbidden_response(self, message: str) -> JSONResponse:
        """返回403禁止访问响应"""
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": "forbidden",
                "message": message,
                "timestamp": time.time()
            }
        )


class OptionalAuthMiddleware(BaseHTTPMiddleware):
    """可选认证中间件
    
    对于某些接口，认证是可选的，如果有令牌则验证，没有则跳过
    """
    
    async def dispatch(self, request: Request, call_next):
        """处理请求"""
        try:
            # 尝试提取令牌
            token = self._extract_token(request)
            
            if token:
                # 如果有令牌，则验证
                auth_service = get_auth_service()
                user_info = await auth_service.verify_access_token(token)
                
                # 将用户信息添加到请求状态
                request.state.user_id = user_info["user_id"]
                request.state.username = user_info["username"]
                request.state.user_role = user_info.get("role", "user")
                request.state.session_id = user_info.get("session_id")
                request.state.authenticated = True
            else:
                # 没有令牌，设置为未认证状态
                request.state.user_id = None
                request.state.username = None
                request.state.user_role = None
                request.state.session_id = None
                request.state.authenticated = False
            
            # 继续处理请求
            response = await call_next(request)
            return response
            
        except Exception:
            # 认证失败，但不阻止请求继续
            request.state.user_id = None
            request.state.username = None
            request.state.user_role = None
            request.state.session_id = None
            request.state.authenticated = False
            
            response = await call_next(request)
            return response
    
    def _extract_token(self, request: Request) -> Optional[str]:
        """从请求中提取令牌"""
        # 从Authorization头提取
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header[7:]  # 移除 "Bearer " 前缀
        
        return None


def require_role(required_role: str):
    """角色权限装饰器"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user_role = getattr(request.state, "user_role", None)
            
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="需要认证"
                )
            
            # 简单的角色层级检查
            role_hierarchy = {
                "user": 1,
                "moderator": 2,
                "admin": 3,
                "super_admin": 4
            }
            
            required_level = role_hierarchy.get(required_role, 0)
            user_level = role_hierarchy.get(user_role, 0)
            
            if user_level < required_level:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"需要{required_role}权限"
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_permissions(permissions: Set[str]):
    """权限检查装饰器"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user_permissions = getattr(request.state, "user_permissions", set())
            
            if not permissions.issubset(user_permissions):
                missing_permissions = permissions - user_permissions
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"缺少权限: {', '.join(missing_permissions)}"
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


# 便捷的依赖函数
async def get_current_user(request: Request) -> dict:
    """获取当前用户信息"""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要认证"
        )
    
    return {
        "user_id": user_id,
        "username": getattr(request.state, "username", None),
        "role": getattr(request.state, "user_role", None),
        "session_id": getattr(request.state, "session_id", None)
    }


async def get_optional_user(request: Request) -> Optional[dict]:
    """获取可选的用户信息"""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        return None
    
    return {
        "user_id": user_id,
        "username": getattr(request.state, "username", None),
        "role": getattr(request.state, "user_role", None),
        "session_id": getattr(request.state, "session_id", None)
    }