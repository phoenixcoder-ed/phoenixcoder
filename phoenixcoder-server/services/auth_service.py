import httpx
from fastapi import HTTPException
from config.settings import settings
from utils.jwt_helper import create_jwt_token, get_unverified_jwt_claims
from typing import Dict, Any

class AuthService:
    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """用授权码换取OIDC令牌"""
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                f"{settings.OIDC_ISSUER}/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.OIDC_REDIRECT_URI,
                    "client_id": settings.OIDC_CLIENT_ID,
                    "client_secret": settings.OIDC_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            if token_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="OIDC token 获取失败")
            token_data = token_resp.json()
            id_token = token_data.get("id_token")
            if not id_token:
                raise HTTPException(status_code=400, detail="未获取到 id_token")
            return token_data

    @staticmethod
    def get_user_info_from_id_token(id_token: str) -> Dict[str, Any]:
        """从id_token中获取用户信息"""
        user_info = get_unverified_jwt_claims(id_token)
        return user_info

    @staticmethod
    def generate_jwt_token(user_info: Dict[str, Any]) -> str:
        """生成自有JWT令牌"""
        return create_jwt_token({
            "sub": user_info["sub"], 
            "email": user_info.get("email")
        })