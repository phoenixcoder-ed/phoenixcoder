"""
简单的单元测试
完全独立，不依赖任何项目配置
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
        
        with pytest.raises(ValueError, match="任务标题至少5个字符"):
            validate_task_data({'title': '短', 'description': 'test', 'budget': 1000})
    
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