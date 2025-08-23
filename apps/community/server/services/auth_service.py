"""
改进的认证服务
遵循单一职责原则和依赖倒置原则
"""

import hashlib
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from fastapi import HTTPException, status
from pydantic import BaseModel

from config.settings import settings
from utils.jwt_helper import create_jwt_token, get_unverified_jwt_claims
from repositories.user_repository import UserRepository
from shared.exceptions import ValidationError
from logging_config import logger

class LoginCredentials(BaseModel):
    """登录凭据"""
    email: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    password: str


class RegisterData(BaseModel):
    """注册数据"""
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    agree_terms: bool = True
    user_type: str = "developer"

class AuthResult(BaseModel):
    """认证结果"""
    success: bool
    user: Optional[Dict[str, Any]] = None
    token: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None

class PasswordService:
    """密码服务 - 单一职责"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """密码哈希"""
        salt = settings.security.jwt_secret[:16].encode()  # 使用JWT密钥的前16位作为盐
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
        return hashed.hex()
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """验证密码"""
        return PasswordService.hash_password(password) == hashed_password
    
    @staticmethod
    def validate_password_strength(password: str) -> None:
        """验证密码强度"""
        if len(password) < settings.security.password_min_length:
            raise ValidationError(f"密码长度至少{settings.security.password_min_length}位")
        
        if not re.search(r'[A-Za-z]', password):
            raise ValidationError("密码必须包含字母")
        
        if not re.search(r'[0-9]', password):
            raise ValidationError("密码必须包含数字")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("密码必须包含特殊字符")

class TokenService:
    """令牌服务 - 单一职责"""
    
    @staticmethod
    def create_access_token(user_data: Dict[str, Any]) -> str:
        """创建访问令牌"""
        payload = {
            "sub": user_data["id"],
            "email": user_data.get("email"),
            "user_type": user_data["user_type"],
            "exp": datetime.utcnow() + timedelta(minutes=settings.security.jwt_expire_minutes),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        return create_jwt_token(payload)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """创建刷新令牌"""
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(days=7),  # 7天有效期
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        return create_jwt_token(payload)
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """解码令牌"""
        return get_unverified_jwt_claims(token)

class AuthService:
    """认证服务 - 依赖注入"""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
        self.password_service = PasswordService()
        self.token_service = TokenService()
        self._login_attempts: Dict[str, int] = {}  # 临时存储，生产环境应使用Redis
    
    async def authenticate(self, credentials: LoginCredentials) -> AuthResult:
        """用户认证"""
        try:
            # 检查登录尝试次数
            identifier = credentials.email or credentials.phone or credentials.username
            if self._is_account_locked(identifier):
                return AuthResult(
                    success=False,
                    error_code="ACCOUNT_LOCKED",
                    error_message="账户已被锁定，请稍后再试"
                )
            
            # 查找用户
            user = await self._find_user(credentials)
            if not user:
                self._record_failed_attempt(identifier)
                return AuthResult(
                    success=False,
                    error_code="USER_NOT_FOUND",
                    error_message="用户不存在"
                )
            
            # 验证密码
            if not self.password_service.verify_password(credentials.password, user["password_hash"]):
                self._record_failed_attempt(identifier)
                return AuthResult(
                    success=False,
                    error_code="INVALID_PASSWORD",
                    error_message="密码错误"
                )
            
            # 检查用户状态
            if not user.get("is_active", True):
                return AuthResult(
                    success=False,
                    error_code="ACCOUNT_DISABLED",
                    error_message="账户已被禁用"
                )
            
            # 清除失败尝试记录
            self._clear_failed_attempts(identifier)
            
            # 更新最后登录时间
            await self.user_repository.update_last_login(user["id"])
            
            # 生成令牌
            access_token = self.token_service.create_access_token(user)
            
            # 移除敏感信息
            safe_user = {k: v for k, v in user.items() if k != "password_hash"}
            
            logger.info(f"用户 {user['id']} 登录成功")
            
            return AuthResult(
                success=True,
                user=safe_user,
                token=access_token
            )
            
        except Exception as e:
            logger.error(f"认证过程发生错误: {str(e)}")
            return AuthResult(
                success=False,
                error_code="INTERNAL_ERROR",
                error_message="认证服务暂时不可用"
            )
    
    async def register(self, user_data: Dict[str, Any]) -> AuthResult:
        """用户注册"""
        try:
            # 验证密码强度
            try:
                self.password_service.validate_password_strength(user_data["password"])
            except ValidationError as e:
                return AuthResult(
                    success=False,
                    error_code="WEAK_PASSWORD",
                    error_message=str(e)
                )
            
            # 检查用户是否已存在
            email = user_data.get("email")
            phone = user_data.get("phone")
            
            if email and await self.user_repository.exists_by_email(email):
                return AuthResult(
                    success=False,
                    error_code="EMAIL_EXISTS",
                    error_message="邮箱已被注册"
                )
            
            if phone and await self.user_repository.exists_by_phone(phone):
                return AuthResult(
                    success=False,
                    error_code="PHONE_EXISTS",
                    error_message="手机号已被注册"
                )
            
            # 哈希密码
            user_data["password_hash"] = self.password_service.hash_password(user_data["password"])
            del user_data["password"]  # 删除明文密码
            
            # 创建用户
            user = await self.user_repository.create(user_data)
            
            # 生成令牌
            access_token = self.token_service.create_access_token(user)
            
            logger.info(f"新用户 {user['id']} 注册成功")
            
            return AuthResult(
                success=True,
                user=user,
                token=access_token
            )
            
        except Exception as e:
            logger.error(f"注册过程发生错误: {str(e)}")
            return AuthResult(
                success=False,
                error_code="INTERNAL_ERROR",
                error_message="注册服务暂时不可用"
            )
    
    async def _find_user(self, credentials: LoginCredentials) -> Optional[Dict[str, Any]]:
        """查找用户"""
        # 目前数据库只支持email查找，phone和username字段不存在
        if credentials.email:
            return await self.user_repository.get_by_email(credentials.email)
        # 如果传入的是phone或username，暂时返回None
        # TODO: 需要数据库迁移添加phone和username字段后才能支持
        return None
    
    def _is_account_locked(self, identifier: str) -> bool:
        """检查账户是否被锁定"""
        attempts = self._login_attempts.get(identifier, 0)
        return attempts >= settings.security.max_login_attempts
    
    def _record_failed_attempt(self, identifier: str) -> None:
        """记录失败尝试"""
        self._login_attempts[identifier] = self._login_attempts.get(identifier, 0) + 1
    
    def _clear_failed_attempts(self, identifier: str) -> None:
        """清除失败尝试记录"""
        self._login_attempts.pop(identifier, None)