from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from services.auth_service import AuthService
from utils.jwt_helper import decode_jwt_token
from config.settings import settings
from typing import Dict, Any, Optional
from pydantic import BaseModel

# 定义登录请求模型
class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    login_type: str

# 定义注册请求模型
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None
    user_type: Optional[str] = 'programmer'

router = APIRouter()

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{settings.OIDC_ISSUER}/authorize",
    tokenUrl=f"{settings.OIDC_ISSUER}/token"
)

@router.get("/login")
def login():
    """跳转到OIDC Provider登录"""
    return {
        "auth_url": f"{settings.OIDC_ISSUER}/authorize?client_id={settings.OIDC_CLIENT_ID}&response_type=code&scope=openid%20profile%20email&redirect_uri={settings.OIDC_REDIRECT_URI}"
    }

@router.post("/register")
async def register(credentials: RegisterRequest):
    """处理用户注册请求"""
    # 验证邮箱是否已存在
    existing_user = await AuthService.check_user_exists(credentials.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 创建新用户
    user_info = await AuthService.create_user(credentials.dict())
    jwt_token = AuthService.generate_jwt_token(user_info)
    return {
        "token": jwt_token,
        "user": user_info
    }

@router.post("/oidc/login")
async def oidc_login(credentials: LoginRequest):
    """处理OIDC登录请求"""
    # 这里应该添加实际的登录逻辑，例如验证用户名密码
    # 为了演示，我们假设验证成功并生成一个JWT令牌
    user_info = {
        "id": "1",
        "sub": "1",  # 添加sub字段，通常是用户唯一标识符
        "name": "Test User",
        "email": credentials.email,
        "phone": credentials.phone,
        "user_type": "programmer"
    }
    jwt_token = AuthService.generate_jwt_token(user_info)
    return {
        "token": jwt_token,
        "user": user_info
    }

@router.get("/auth/callback")
async def auth_callback(code: str):
    """OIDC回调处理"""
    token_data = await AuthService.exchange_code_for_token(code)
    id_token = token_data.get("id_token")
    user_info = AuthService.get_user_info_from_id_token(id_token)
    jwt_token = AuthService.generate_jwt_token(user_info)
    return {"jwt": jwt_token, "user": user_info}

@router.get("/me")
def me(token: str = Depends(oauth2_scheme)):
    """获取当前用户信息"""
    payload = decode_jwt_token(token)
    return {"user": payload}