"""
认证依赖模块
提供FastAPI认证相关的依赖注入函数
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.jwt_helper import decode_jwt_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    获取当前认证用户
    
    Args:
        credentials: HTTP Bearer认证凭据
        
    Returns:
        Dict[str, Any]: 用户信息
        
    Raises:
        HTTPException: 认证失败时抛出401错误
    """
    try:
        # 解码JWT token
        payload = decode_jwt_token(credentials.credentials)
        
        # 验证token是否包含必要信息
        if not payload or "user_id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证失败",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    request: Request
) -> Optional[Dict[str, Any]]:
    """
    获取可选的当前用户（不强制认证）
    
    Args:
        request: FastAPI请求对象
        
    Returns:
        Optional[Dict[str, Any]]: 用户信息，如果未认证则返回None
    """
    try:
        # 尝试从请求头获取Authorization
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return None
            
        token = authorization.split(" ")[1]
        payload = decode_jwt_token(token)
        
        if not payload or "user_id" not in payload:
            return None
            
        return payload
        
    except Exception:
        return None


async def get_current_user_id(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> int:
    """
    获取当前用户ID
    
    Args:
        current_user: 当前用户信息
        
    Returns:
        int: 用户ID
    """
    return current_user["user_id"]