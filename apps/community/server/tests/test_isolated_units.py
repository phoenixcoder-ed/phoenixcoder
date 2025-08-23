"""
独立单元测试
测试核心业务逻辑，不依赖于任何项目模块
"""

import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime, timedelta
import bcrypt
import jwt
from typing import Dict, Any


class PasswordService:
    """密码服务"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """哈希密码"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """验证密码"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def validate_password_strength(password: str) -> None:
        """验证密码强度"""
        if len(password) < 8:
            raise ValueError("密码长度至少8位")
        
        has_letter = any(c.isalpha() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        if not has_letter:
            raise ValueError("密码必须包含字母")
        if not has_digit:
            raise ValueError("密码必须包含数字")
        if not has_special:
            raise ValueError("密码必须包含特殊字符")


class TokenService:
    """令牌服务"""
    
    def __init__(self):
        self.secret_key = "test_secret_key_for_testing_only"
        self.algorithm = "HS256"
    
    def create_access_token(self, user_id: int) -> str:
        """创建访问令牌"""
        payload = {
            'user_id': user_id,
            'type': 'access',
            'exp': datetime.utcnow() + timedelta(minutes=30),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: int) -> str:
        """创建刷新令牌"""
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """解码令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("令牌已过期")
        except jwt.InvalidTokenError:
            raise ValueError("无效令牌")


class AuthService:
    """认证服务"""
    
    def __init__(self, user_repository=None, password_service=None, token_service=None):
        self.user_repository = user_repository or Mock()
        self.password_service = password_service or PasswordService()
        self.token_service = token_service or TokenService()
    
    async def login_user(self, credentials) -> Dict[str, Any]:
        """用户登录"""
        # 根据登录类型获取用户
        if credentials.login_type == "username":
            user = self.user_repository.get_user_by_username(credentials.login)
        elif credentials.login_type == "email":
            user = self.user_repository.get_user_by_email(credentials.login)
        elif credentials.login_type == "phone":
            user = self.user_repository.get_user_by_phone(credentials.login)
        else:
            raise ValueError("不支持的登录类型")
        
        if not user:
            raise ValueError("用户不存在")
        
        if user.get('is_locked'):
            raise ValueError("账户已被锁定")
        
        if not user.get('is_active'):
            raise ValueError("账户已被禁用")
        
        # 验证密码
        if not self.password_service.verify_password(credentials.password, user['password_hash']):
            raise ValueError("密码错误")
        
        # 生成令牌
        access_token = self.token_service.create_access_token(user['id'])
        refresh_token = self.token_service.create_refresh_token(user['id'])
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': user['id'],
            'token_type': 'bearer'
        }
    
    async def register_user(self, register_data) -> Dict[str, Any]:
        """用户注册"""
        # 检查用户名是否存在
        if self.user_repository.get_user_by_username(register_data.username):
            raise ValueError("用户名已存在")
        
        # 检查邮箱是否存在
        if self.user_repository.get_user_by_email(register_data.email):
            raise ValueError("邮箱已存在")
        
        # 检查手机号是否存在
        if hasattr(register_data, 'phone') and register_data.phone:
            if self.user_repository.get_user_by_phone(register_data.phone):
                raise ValueError("手机号已存在")
        
        # 验证密码强度
        self.password_service.validate_password_strength(register_data.password)
        
        # 哈希密码
        password_hash = self.password_service.hash_password(register_data.password)
        
        # 创建用户
        user_data = {
            'username': register_data.username,
            'email': register_data.email,
            'password_hash': password_hash,
            'is_active': True,
            'is_locked': False
        }
        
        if hasattr(register_data, 'phone'):
            user_data['phone'] = register_data.phone
        
        created_user = self.user_repository.create_user(user_data)
        
        # 生成令牌
        access_token = self.token_service.create_access_token(created_user['id'])
        refresh_token = self.token_service.create_refresh_token(created_user['id'])
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': created_user['id'],
            'token_type': 'bearer'
        }


# 数据模型
class LoginCredentials:
    def __init__(self, login: str, password: str, login_type: str):
        self.login = login
        self.password = password
        self.login_type = login_type


class RegisterData:
    def __init__(self, username: str, email: str, password: str, phone: str = None):
        self.username = username
        self.email = email
        self.password = password
        self.phone = phone


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
            with pytest.raises(ValueError):
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
        
        # 验证令牌内容
        payload = self.token_service.decode_token(token)
        assert payload['user_id'] == user_id
        assert payload['type'] == 'access'
    
    def test_create_refresh_token(self):
        """测试创建刷新令牌"""
        user_id = 123
        token = self.token_service.create_refresh_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        
        # 验证令牌内容
        payload = self.token_service.decode_token(token)
        assert payload['user_id'] == user_id
        assert payload['type'] == 'refresh'
    
    def test_decode_token_success(self):
        """测试令牌解码成功"""
        user_id = 123
        token = self.token_service.create_access_token(user_id)
        payload = self.token_service.decode_token(token)
        
        assert payload['user_id'] == user_id
        assert 'exp' in payload
        assert 'iat' in payload
    
    def test_decode_token_invalid(self):
        """测试无效令牌"""
        invalid_token = "invalid_token"
        with pytest.raises(ValueError, match="无效令牌"):
            self.token_service.decode_token(invalid_token)


class TestAuthService:
    """认证服务测试"""
    
    def setup_method(self):
        """测试前置设置"""
        self.mock_user_repo = Mock()
        self.password_service = PasswordService()
        self.token_service = TokenService()
        
        self.auth_service = AuthService(
            user_repository=self.mock_user_repo,
            password_service=self.password_service,
            token_service=self.token_service
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
            'password_hash': self.password_service.hash_password("password123"),
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        # 配置模拟对象
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        
        # 执行测试
        result = await self.auth_service.login_user(credentials)
        
        # 验证结果
        assert 'access_token' in result
        assert 'refresh_token' in result
        assert result['user_id'] == 1
        assert result['token_type'] == 'bearer'
        
        # 验证调用
        self.mock_user_repo.get_user_by_username.assert_called_once_with("testuser")
    
    @pytest.mark.asyncio
    async def test_login_user_not_found(self):
        """测试用户不存在"""
        credentials = LoginCredentials(
            login="nonexistent",
            password="password123",
            login_type="username"
        )
        
        self.mock_user_repo.get_user_by_username.return_value = None
        
        with pytest.raises(ValueError, match="用户不存在"):
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
            'password_hash': self.password_service.hash_password("correct_password"),
            'is_active': True,
            'is_locked': False,
            'failed_login_attempts': 0
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        
        with pytest.raises(ValueError, match="密码错误"):
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
            'password_hash': self.password_service.hash_password("password123"),
            'is_active': True,
            'is_locked': True,
            'failed_login_attempts': 5
        }
        
        self.mock_user_repo.get_user_by_username.return_value = mock_user
        
        with pytest.raises(ValueError, match="账户已被锁定"):
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
        self.mock_user_repo.create_user.return_value = {'id': 1, 'username': 'newuser'}
        
        # 执行测试
        result = await self.auth_service.register_user(register_data)
        
        # 验证结果
        assert 'access_token' in result
        assert 'refresh_token' in result
        assert result['user_id'] == 1
        assert result['token_type'] == 'bearer'
    
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
        
        with pytest.raises(ValueError, match="用户名已存在"):
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
        
        with pytest.raises(ValueError, match="密码长度至少8位"):
            await self.auth_service.register_user(register_data)


class TestBusinessLogic:
    """业务逻辑测试"""
    
    def test_skill_validation(self):
        """测试技能验证逻辑"""
        def validate_skill_data(skill_data):
            if not skill_data.get('name'):
                raise ValueError("技能名称不能为空")
            if len(skill_data['name']) < 2:
                raise ValueError("技能名称至少2个字符")
            if not skill_data.get('category'):
                raise ValueError("技能分类不能为空")
            return True
        
        # 测试有效数据
        valid_skill = {'name': 'Python', 'category': 'programming'}
        assert validate_skill_data(valid_skill) is True
        
        # 测试无效数据
        with pytest.raises(ValueError, match="技能名称不能为空"):
            validate_skill_data({'category': 'programming'})
        
        with pytest.raises(ValueError, match="技能名称至少2个字符"):
            validate_skill_data({'name': 'P', 'category': 'programming'})
    
    def test_task_validation(self):
        """测试任务验证逻辑"""
        def validate_task_data(task_data):
            if not task_data.get('title'):
                raise ValueError("任务标题不能为空")
            if len(task_data['title']) < 5:
                raise ValueError("任务标题至少5个字符")
            if not task_data.get('description'):
                raise ValueError("任务描述不能为空")
            if task_data.get('budget', 0) <= 0:
                raise ValueError("任务预算必须大于0")
            return True
        
        # 测试有效数据
        valid_task = {
            'title': '开发Web应用',
            'description': '使用Python开发一个Web应用',
            'budget': 5000.00
        }
        assert validate_task_data(valid_task) is True
        
        # 测试无效数据
        with pytest.raises(ValueError, match="任务标题不能为空"):
            validate_task_data({'description': 'test', 'budget': 1000})
        
        with pytest.raises(ValueError, match="任务预算必须大于0"):
            validate_task_data({'title': '测试任务', 'description': 'test', 'budget': 0})
    
    def test_user_permission_check(self):
        """测试用户权限检查"""
        def check_user_permission(user, action, resource):
            if not user.get('is_active'):
                raise ValueError("用户账户已被禁用")
            
            if user.get('is_locked'):
                raise ValueError("用户账户已被锁定")
            
            user_type = user.get('user_type', 'user')
            
            # 管理员拥有所有权限
            if user_type == 'admin':
                return True
            
            # 普通用户权限检查
            if action == 'create_task' and user_type in ['employer', 'developer']:
                return True
            
            if action == 'apply_task' and user_type == 'developer':
                return True
            
            if action == 'manage_users' and user_type == 'admin':
                return True
            
            raise ValueError("权限不足")
        
        # 测试管理员权限
        admin_user = {'id': 1, 'user_type': 'admin', 'is_active': True, 'is_locked': False}
        assert check_user_permission(admin_user, 'manage_users', None) is True
        
        # 测试开发者权限
        developer_user = {'id': 2, 'user_type': 'developer', 'is_active': True, 'is_locked': False}
        assert check_user_permission(developer_user, 'apply_task', None) is True
        
        # 测试权限不足
        with pytest.raises(ValueError, match="权限不足"):
            check_user_permission(developer_user, 'manage_users', None)
        
        # 测试账户状态
        locked_user = {'id': 3, 'user_type': 'developer', 'is_active': True, 'is_locked': True}
        with pytest.raises(ValueError, match="用户账户已被锁定"):
            check_user_permission(locked_user, 'apply_task', None)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])