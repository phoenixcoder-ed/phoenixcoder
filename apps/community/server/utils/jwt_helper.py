from jose import jwt, JWTError
from config.settings import settings
from fastapi import HTTPException, status
from typing import Dict, Any, Optional

def create_jwt_token(payload: Dict[str, Any]) -> str:
    """创建JWT令牌"""
    return jwt.encode(payload, settings.security.jwt_secret, algorithm=settings.security.jwt_algorithm)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """解码JWT令牌"""
    try:
        payload = jwt.decode(token, settings.security.jwt_secret, algorithms=[settings.security.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的 token")

def get_unverified_jwt_claims(token: str) -> Dict[str, Any]:
    """获取未验证的JWT声明"""
    try:
        return jwt.get_unverified_claims(token)
    except JWTError:
        raise HTTPException(status_code=400, detail="token 解析失败")