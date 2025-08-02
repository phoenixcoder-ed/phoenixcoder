import os
import httpx
import json
from models import User
from database import DatabaseService

class WechatService:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
        self.app_id = os.getenv("WECHAT_APPID")
        self.app_secret = os.getenv("WECHAT_APPSECRET")
        self.redirect_uri = os.getenv("WECHAT_REDIRECT_URI")
        
        if not all([self.app_id, self.app_secret]):
            raise ValueError("微信AppID和AppSecret必须配置")

    async def get_access_token(self, code: str) -> dict:
        """使用授权码换取access_token"""
        url = f"https://api.weixin.qq.com/sns/oauth2/access_token?"
        params = {
            "appid": self.app_id,
            "secret": self.app_secret,
            "code": code,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            result = response.json()
            
            if "errcode" in result:
                raise Exception(f"获取access_token失败: {result}")
            
            return result

    async def get_user_info(self, access_token: str, openid: str) -> dict:
        """使用access_token和openid获取用户信息"""
        url = f"https://api.weixin.qq.com/sns/userinfo?"
        params = {
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            result = response.json()
            
            if "errcode" in result:
                raise Exception(f"获取用户信息失败: {result}")
            
            return result

    async def exchange_code_for_user(self, code: str, user_type: str) -> User:
        """使用微信授权码换取用户信息并创建用户"""
        # 1. 获取access_token和openid
        token_info = await self.get_access_token(code)
        access_token = token_info["access_token"]
        openid = token_info["openid"]
        
        # 2. 检查用户是否已存在
        existing_user = self.db_service.get_user_by_wechat_openid(openid)
        if existing_user:
            return existing_user
        
        # 3. 获取用户信息
        user_info = await self.get_user_info(access_token, openid)
        
        # 4. 创建新用户
        new_user = self.db_service.create_wechat_user(
            openid=openid,
            nickname=user_info.get("nickname", "微信用户"),
            avatar_url=user_info.get("headimgurl", ""),
            user_type=user_type
        )
        
        return new_user