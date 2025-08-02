from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from services.auth_service import AuthService
from utils.jwt_helper import decode_jwt_token
from config.settings import settings
from typing import Dict, Any

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