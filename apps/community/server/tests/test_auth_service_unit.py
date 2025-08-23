"""
认证服务单元测试
测试认证相关的核心业务逻辑
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
import bcrypt
import jwt
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 模拟配置设置
with patch.dict(os.environ, {
    'DATABASE_PASSWORD': 'test_password',
    'JWT_SECRET_KEY': 'test_secret_key',
    'OIDC__ISSUER': 'http://localhost:8000',
    'OIDC__CLIENT_ID': 'test-client-id',
    'OIDC__CLIENT_SECRET': 'test-client-secret',
    'OIDC__REDIRECT_URI': 'http://localhost:3000/auth/callback',
    'SECURITY__JWT_SECRET': 'test-super-secret-jwt-key-at-least-32-characters-long',
    'ENVIRONMENT': 'testing'
}):
    from services.auth_service import (
        PasswordService, TokenService, AuthService,
        LoginCredentials, RegisterData, AuthResult
    )
    from shared.exceptions import (
        ValidationError, UserNotFoundError, InvalidCredentialsError,
        AccountLockedError, UserAlreadyExistsError, PermissionDeniedError,
        AccountInactiveError
    )


class TestPasswordService:
    """密码服务测试"""
    
    def setup_method(self):
        """测试前置设置"""
        self.password_service = PasswordService()
    
    def test_hash_password(self):
        """测试密码哈希"""
        password = "test_password_123"
        hashed = self.password_service.hash_password(password)
        
        assert hashed is not None
        assert hashed != password
        assert isinstance(hashed, str)
        assert len(hashed) > 0
        # 验证同样的密码产生同样的哈希
        hashed2 = self.password_service.hash_password(password)
        assert hashed == hashed2
    
    def test_verify_password_success(self):
        """测试密码验证成功"""
        password = "test_password_123"
        hashed = self.password_service.hash_password(password)
        
        result = self.password_service.verify_password(password, hashed)
        assert result is True
    
    def test_verify_password_failure(self):
        """测试密码验证失败"""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = self.password_service.hash_password(password)
        
        result = self.password_service.verify_password(wrong_password, hashed)
        assert result is False
    
    def test_validate_password_strength_valid(self):
        """测试强密码验证"""
        strong_passwords = [
            "StrongPass123!",
            "MySecure@Pass456",
            "Complex#Password789"
        ]
        
        for password in strong_passwords:
            # 不应该抛出异常
            self.password_service.validate_password_strength(password)
    
    def test_validate_password_strength_weak(self):
        """测试弱密码验证"""
        weak_passwords = [
            "123",           # 太短
            "password",      # 无数字和特殊字符
            "12345678",      # 只有数字
            "PASSWORD",      # 只有大写字母
        ]
        
        for password in weak_passwords:
            with pytest.raises(ValidationError):
                self.password_service.validate_password_strength(password)


class TestTokenService:
    """令牌服务测试"""
    
    def setup_method(self):
        """测试前置设置"""
        self.token_service = TokenService()
    
    def test_create_access_token(self):
        """测试创建访问令牌"""
        user_data = {
            "id": "123",
            "email": "test@example.com",
            "user_type": "developer"
        }
        token = self.token_service.create_access_token(user_data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_refresh_token(self):
        """测试创建刷新令牌"""
        user_id = "123"
        token = self.token_service.create_refresh_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    @patch('services.auth_service.get_unverified_jwt_claims')
    def test_decode_token_success(self, mock_get_claims):
        """测试令牌解码成功"""
        mock_get_claims.return_value = {
            'sub': '123',
            'email': 'test@example.com',
            'user_type': 'developer',
            'exp': (datetime.utcnow() + timedelta(hours=1)).timestamp()
        }
        
        token = "valid_token"
        payload = self.token_service.decode_token(token)
        
        assert payload['sub'] == '123'
        assert payload['email'] == 'test@example.com'
        mock_get_claims.assert_called_once_with(token)
    
    @patch('services.auth_service.get_unverified_jwt_claims')
    def test_decode_token_expired(self, mock_get_claims):
        """测试令牌过期"""
        from jose import JWTError
        mock_get_claims.side_effect = JWTError("Token has expired")
        
        token = "expired_token"
        with pytest.raises(JWTError):
            self.token_service.decode_token(token)
    
    @patch('services.auth_service.get_unverified_jwt_claims')
    def test_decode_token_invalid(self, mock_get_claims):
        """测试无效令牌"""
        from jose import JWTError
        mock_get_claims.side_effect = JWTError("Invalid token")
        
        token = "invalid_token"
        with pytest.raises(JWTError):
            self.token_service.decode_token(token)


class TestAuthService:
    """认证服务测试"""
    
    def setup_method(self):
        """测试前置设置"""
        self.mock_user_repo = Mock()
        self.mock_password_service = Mock()
        self.mock_token_service = Mock()
        
        self.auth_service = AuthService(
            user_repository=self.mock_user_repo,
            password_service=self.mock_password_service,
            token_service=self.mock_token_service
        )
    
    @pytest.mark.asyncio
    async def test_login_user_success(self):
        """测试用户登录成功"""
        # 准备测试数据
        credentials = LoginCredentials(
            login="testuser",
            password="password123",
            login_type="username"
        )
        
        mock_user = {
            'id': 1,
            'username': 'testuser',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        # 配置模拟对象
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        self.mock_password_service.verify_password.return_value = True
        self.mock_token_service.create_access_token.return_value = "access_token"
        self.mock_token_service.create_refresh_token.return_value = "refresh_token"
        
        # 执行测试
        result = await self.auth_service.login_user(credentials)
        
        # 验证结果
        assert isinstance(result, AuthResult)
        assert result.access_token == "access_token"
        assert result.refresh_token == "refresh_token"
        assert result.user_id == 1
        
        # 验证调用
        self.mock_user_repo.get_user_by_username.assert_called_once_with("testuser")
        self.mock_password_service.verify_password.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_login_user_not_found(self):
        """测试用户不存在"""
        credentials = LoginCredentials(
            login="nonexistent",
            password="password123",
            login_type="username"
        )
        
        self.mock_user_repo.get_user_by_username.return_value = None
        
        with pytest.raises(UserNotFoundError):
            await self.auth_service.login_user(credentials)
    
    @pytest.mark.asyncio
    async def test_login_user_wrong_password(self):
        """测试密码错误"""
        credentials = LoginCredentials(
            login="testuser",
            password="wrong_password",
            login_type="username"
        )
        
        mock_user = {
            'id': 1,
            'username': 'testuser',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        self.mock_password_service.verify_password.return_value = False
        
        with pytest.raises(InvalidCredentialsError):
            await self.auth_service.login_user(credentials)
    
    @pytest.mark.asyncio
    async def test_login_user_account_locked(self):
        """测试账户锁定"""
        credentials = LoginCredentials(
            login="testuser",
            password="password123",
            login_type="username"
        )
        
        mock_user = {
            'id': 1,
            'username': 'testuser',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': True,
            'failed_login_attempts': 5
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        
        with pytest.raises(AccountLockedError):
            await self.auth_service.login_user(credentials)
    
    @pytest.mark.asyncio
    async def test_register_user_success(self):
        """测试用户注册成功"""
        register_data = RegisterData(
            username="newuser",
            email="new@example.com",
            password="StrongPass123!",
            phone="13800138000"
        )
        
        # 配置模拟对象
        self.mock_user_repo.get_user_by_username.return_value = None
        self.mock_user_repo.get_user_by_email.return_value = None
        self.mock_user_repo.get_user_by_phone.return_value = None
        self.mock_password_service.validate_password_strength.return_value = None
        self.mock_password_service.hash_password.return_value = "hashed_password"
        self.mock_user_repo.create_user.return_value = {'id': 1, 'username': 'newuser'}
        self.mock_token_service.create_access_token.return_value = "access_token"
        self.mock_token_service.create_refresh_token.return_value = "refresh_token"
        
        # 执行测试
        result = await self.auth_service.register_user(register_data)
        
        # 验证结果
        assert isinstance(result, AuthResult)
        assert result.access_token == "access_token"
        assert result.refresh_token == "refresh_token"
        assert result.user_id == 1
    
    @pytest.mark.asyncio
    async def test_register_user_username_exists(self):
        """测试用户名已存在"""
        register_data = RegisterData(
            username="existinguser",
            email="new@example.com",
            password="StrongPass123!",
            phone="13800138000"
        )
        
        self.mock_user_repo.get_user_by_username.return_value = {'id': 1}
        
        with pytest.raises(UserAlreadyExistsError):
            await self.auth_service.register_user(register_data)
    
    @pytest.mark.asyncio
    async def test_register_user_weak_password(self):
        """测试弱密码注册"""
        register_data = RegisterData(
            username="newuser",
            email="new@example.com",
            password="weak",
            phone="13800138000"
        )
        
        self.mock_user_repo.get_user_by_username.return_value = None
        self.mock_user_repo.get_user_by_email.return_value = None
        self.mock_user_repo.get_user_by_phone.return_value = None
        self.mock_password_service.validate_password_strength.side_effect = ValidationError("密码强度不足")
        
        with pytest.raises(ValidationError):
            await self.auth_service.register_user(register_data)
    
    @pytest.mark.asyncio
    async def test_register_user_email_exists(self):
        """测试邮箱已存在"""
        register_data = RegisterData(
            username="newuser",
            email="existing@example.com",
            password="StrongPass123!",
            phone="13800138000"
        )
        
        self.mock_user_repo.get_user_by_username.return_value = None
        self.mock_user_repo.get_user_by_email.return_value = {'id': 2, 'email': 'existing@example.com'}
        
        with pytest.raises(UserAlreadyExistsError):
            await self.auth_service.register_user(register_data)
    
    @pytest.mark.asyncio
    async def test_register_user_phone_exists(self):
        """测试手机号已存在"""
        register_data = RegisterData(
            username="newuser",
            email="new@example.com",
            password="StrongPass123!",
            phone="13800138000"
        )
        
        self.mock_user_repo.get_user_by_username.return_value = None
        self.mock_user_repo.get_user_by_email.return_value = None
        self.mock_user_repo.get_user_by_phone.return_value = {'id': 3, 'phone': '13800138000'}
        
        with pytest.raises(UserAlreadyExistsError):
            await self.auth_service.register_user(register_data)
    
    @pytest.mark.asyncio
    async def test_login_user_inactive_account(self):
        """测试非活跃账户登录"""
        credentials = LoginCredentials(
            login="testuser",
            password="password123",
            login_type="username"
        )
        
        mock_user = {
            'id': 1,
            'username': 'testuser',
            'password_hash': 'hashed_password',
            'is_active': False,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        
        with pytest.raises(AccountInactiveError):
            await self.auth_service.login_user(credentials)
    
    @pytest.mark.asyncio
    async def test_login_user_email_login(self):
        """测试邮箱登录"""
        credentials = LoginCredentials(
            login="test@example.com",
            password="password123",
            login_type="email"
        )
        
        mock_user = {
            'id': 1,
            'email': 'test@example.com',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        self.mock_user_repo.get_user_by_email.return_value = mock_user
        self.mock_password_service.verify_password.return_value = True
        self.mock_token_service.create_access_token.return_value = "access_token"
        self.mock_token_service.create_refresh_token.return_value = "refresh_token"
        
        result = await self.auth_service.login_user(credentials)
        
        assert isinstance(result, AuthResult)
        assert result.access_token == "access_token"
        assert result.refresh_token == "refresh_token"
        assert result.user_id == 1
        
        self.mock_user_repo.get_user_by_email.assert_called_once_with("test@example.com")
    
    @pytest.mark.asyncio
    async def test_login_user_phone_login(self):
        """测试手机号登录"""
        credentials = LoginCredentials(
            login="13800138000",
            password="password123",
            login_type="phone"
        )
        
        mock_user = {
            'id': 1,
            'phone': '13800138000',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        self.mock_user_repo.get_user_by_phone.return_value = mock_user
        self.mock_password_service.verify_password.return_value = True
        self.mock_token_service.create_access_token.return_value = "access_token"
        self.mock_token_service.create_refresh_token.return_value = "refresh_token"
        
        result = await self.auth_service.login_user(credentials)
        
        assert isinstance(result, AuthResult)
        assert result.access_token == "access_token"
        assert result.refresh_token == "refresh_token"
        assert result.user_id == 1
        
        self.mock_user_repo.get_user_by_phone.assert_called_once_with("13800138000")
    
    @pytest.mark.asyncio
    async def test_login_user_failed_attempts_increment(self):
        """测试登录失败次数递增"""
        credentials = LoginCredentials(
            login="testuser",
            password="wrong_password",
            login_type="username"
        )
        
        mock_user = {
            'id': 1,
            'username': 'testuser',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 2
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        self.mock_password_service.verify_password.return_value = False
        
        with pytest.raises(InvalidCredentialsError):
            await self.auth_service.login_user(credentials)
        
        # 验证失败次数记录被调用
        self.mock_user_repo.increment_failed_attempts.assert_called_once_with(1)
    
    @pytest.mark.asyncio
    async def test_login_user_clear_failed_attempts_on_success(self):
        """测试登录成功时清除失败次数"""
        credentials = LoginCredentials(
            login="testuser",
            password="password123",
            login_type="username"
        )
        
        mock_user = {
            'id': 1,
            'username': 'testuser',
            'password_hash': 'hashed_password',
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 2
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        self.mock_password_service.verify_password.return_value = True
        self.mock_token_service.create_access_token.return_value = "access_token"
        self.mock_token_service.create_refresh_token.return_value = "refresh_token"
        
        result = await self.auth_service.login_user(credentials)
        
        assert isinstance(result, AuthResult)
        # 验证失败次数被清除
        self.mock_user_repo.clear_failed_attempts.assert_called_once_with(1)
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(self):
        """测试刷新令牌成功"""
        refresh_token = "valid_refresh_token"
        user_id = 1
        
        self.mock_token_service.decode_token.return_value = {'user_id': user_id}
        self.mock_token_service.create_access_token.return_value = "new_access_token"
        self.mock_token_service.create_refresh_token.return_value = "new_refresh_token"
        
        result = await self.auth_service.refresh_token(refresh_token)
        
        assert isinstance(result, AuthResult)
        assert result.access_token == "new_access_token"
        assert result.refresh_token == "new_refresh_token"
        assert result.user_id == user_id
    
    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self):
        """测试无效刷新令牌"""
        refresh_token = "invalid_refresh_token"
        
        self.mock_token_service.decode_token.side_effect = ValidationError("Invalid token")
        
        with pytest.raises(ValidationError):
            await self.auth_service.refresh_token(refresh_token)
    
    @pytest.mark.asyncio
    async def test_logout_user_success(self):
        """测试用户登出成功"""
        user_id = 1
        access_token = "valid_access_token"
        
        # 模拟令牌黑名单操作
        self.mock_token_service.blacklist_token.return_value = None
        
        result = await self.auth_service.logout_user(user_id, access_token)
        
        assert result is True
        self.mock_token_service.blacklist_token.assert_called_once_with(access_token)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])