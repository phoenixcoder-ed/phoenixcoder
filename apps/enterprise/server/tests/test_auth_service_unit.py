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
    'JWT_SECRET_KEY': 'test_secret_key'
}):
    from services.auth_service import (
        PasswordService, TokenService, AuthService,
        LoginCredentials, RegisterData, AuthResult
    )
    from shared.exceptions import (
        ValidationError, UserNotFoundError, InvalidCredentialsError,
        AccountLockedError, UserAlreadyExistsError, PermissionDeniedError
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
        assert bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
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
        user_id = 123
        token = self.token_service.create_access_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_refresh_token(self):
        """测试创建刷新令牌"""
        user_id = 123
        token = self.token_service.create_refresh_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    @patch('services.auth_service.jwt')
    def test_decode_token_success(self, mock_jwt):
        """测试令牌解码成功"""
        mock_jwt.decode.return_value = {
            'user_id': 123,
            'exp': (datetime.utcnow() + timedelta(hours=1)).timestamp()
        }
        
        token = "valid_token"
        payload = self.token_service.decode_token(token)
        
        assert payload['user_id'] == 123
        mock_jwt.decode.assert_called_once()
    
    @patch('services.auth_service.jwt')
    def test_decode_token_expired(self, mock_jwt):
        """测试令牌过期"""
        mock_jwt.decode.side_effect = jwt.ExpiredSignatureError()
        
        token = "expired_token"
        with pytest.raises(ValidationError):
            self.token_service.decode_token(token)
    
    @patch('services.auth_service.jwt')
    def test_decode_token_invalid(self, mock_jwt):
        """测试无效令牌"""
        mock_jwt.decode.side_effect = jwt.InvalidTokenError()
        
        token = "invalid_token"
        with pytest.raises(ValidationError):
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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])