import httpx
from fastapi import HTTPException
from config.settings import settings
from utils.jwt_helper import create_jwt_token, get_unverified_jwt_claims
from typing import Dict, Any, Optional
from logging_config import logger

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
                logger.error(f"OIDC token 获取失败: 状态码 {token_resp.status_code}, 响应: {token_resp.text}")
                raise HTTPException(status_code=400, detail="OIDC token 获取失败")
            token_data = token_resp.json()
            id_token = token_data.get("id_token")
            if not id_token:
                logger.error("未获取到 id_token")
                raise HTTPException(status_code=400, detail="未获取到 id_token")
            return token_data

    @staticmethod
    def get_user_info_from_id_token(id_token: str) -> Dict[str, Any]:
        """从id_token中获取用户信息"""
        user_info = get_unverified_jwt_claims(id_token)
        return user_info

    @staticmethod
    async def check_user_exists(email: str) -> bool:
        """检查用户是否已存在"""
        # 实际应用中应该查询数据库
        # 这里模拟检查，假设邮箱为test@example.com的用户已存在
        return email == "test@example.com"

    @staticmethod
    async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新用户"""
        # 实际应用中应该将用户数据保存到数据库
        # 这里模拟创建用户，并返回用户信息
        user_id = str(hash(user_data["email"]))[:8]
        valid_user_types = ['programmer', 'merchant', 'admin']
        user_type = user_data.get("user_type", "programmer")
        if user_type not in valid_user_types:
            user_type = "programmer"
        return {
            "id": user_id,
            "sub": user_id,
            "name": user_data["name"],
            "email": user_data["email"],
            "phone": user_data.get("phone"),
            "user_type": user_type
        }

    @staticmethod
    def generate_jwt_token(user_info: Dict[str, Any]) -> str:
        """生成自有JWT令牌"""
        return create_jwt_token({
            "sub": user_info["sub"], 
            "email": user_info.get("email"),
            "name": user_info.get("name")
        })