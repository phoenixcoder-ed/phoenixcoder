import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app, db_service
from models import User, UserCreate, UserType
from database import DatabaseService

client = TestClient(app)

@pytest.mark.unit
@pytest.mark.auth
class TestRegistration:
    """用户注册功能单元测试"""
    
    def setup_method(self):
        """每个测试方法执行前的设置"""
        # 清理数据库状态
        pass
    
    @patch('main.db_service')
    def test_register_success(self, mock_db):
        """测试用户注册成功"""
        # 模拟数据库服务
        mock_db.get_user_by_email.return_value = None  # 用户不存在
        mock_db.get_user_by_phone.return_value = None  # 手机号不存在
        mock_db.create_user.return_value = User(
            id="user123",
            email="test@example.com",
            phone="13800138000",
            name="Test User",
            user_type=UserType.REGULAR,
            password_hash="hashed_password",
            is_active=True
        )
        
        # 发送注册请求
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
        
        # 验证数据库调用
        mock_db.get_user_by_email.assert_called_once_with("test@example.com")
        mock_db.get_user_by_phone.assert_called_once_with("13800138000")
        mock_db.create_user.assert_called_once()
    
    @patch('main.db_service')
    def test_register_email_already_exists(self, mock_db):
        """测试邮箱已存在的情况"""
        # 模拟邮箱已存在
        mock_db.get_user_by_email.return_value = User(
            id="existing_user",
            email="test@example.com",
            name="Existing User",
            user_type=UserType.REGULAR,
            password_hash="hashed_password",
            is_active=True
        )
        
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    @patch('main.db_service')
    def test_register_phone_already_exists(self, mock_db):
        """测试手机号已存在的情况"""
        # 模拟手机号已存在
        mock_db.get_user_by_email.return_value = None
        mock_db.get_user_by_phone.return_value = User(
            id="existing_user",
            phone="13800138000",
            name="Existing User",
            user_type=UserType.REGULAR,
            password_hash="hashed_password",
            is_active=True
        )
        
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 400
        assert "Phone number already registered" in response.json()["detail"]
    
    def test_register_password_mismatch(self):
        """测试密码不匹配的情况"""
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "different_password"
        })
        
        assert response.status_code == 400
        assert "Passwords do not match" in response.json()["detail"]
    
    def test_register_invalid_email_format(self):
        """测试无效邮箱格式"""
        response = client.post("/register", json={
            "email": "invalid-email",
            "phone": "13800138000",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_invalid_phone_format(self):
        """测试无效手机号格式"""
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "invalid-phone",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password(self):
        """测试弱密码"""
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "Test User",
            "password": "123",  # 太短的密码
            "confirm_password": "123"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_missing_required_fields(self):
        """测试缺少必需字段"""
        response = client.post("/register", json={
            "email": "test@example.com",
            # 缺少其他必需字段
        })
        
        assert response.status_code == 422  # Validation error
    
    @patch('main.db_service')
    def test_register_database_error(self, mock_db):
        """测试数据库错误"""
        # 模拟数据库错误
        mock_db.get_user_by_email.return_value = None
        mock_db.get_user_by_phone.return_value = None
        mock_db.create_user.side_effect = Exception("Database connection error")
        
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    def test_register_empty_name(self):
        """测试空用户名"""
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": "",  # 空用户名
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_long_name(self):
        """测试过长的用户名"""
        long_name = "a" * 101  # 超过100字符的用户名
        response = client.post("/register", json={
            "email": "test@example.com",
            "phone": "13800138000",
            "name": long_name,
            "password": "password123",
            "confirm_password": "password123"
        })
        
        assert response.status_code == 422  # Validation error

@pytest.mark.unit
@pytest.mark.auth
class TestRegistrationValidation:
    """注册数据验证测试"""
    
    def test_email_validation_cases(self):
        """测试各种邮箱验证情况"""
        invalid_emails = [
            "plainaddress",
            "@missingdomain.com",
            "missing@.com",
            "missing@domain",
            "spaces @domain.com",
            "toolong" + "a" * 100 + "@domain.com"
        ]
        
        for email in invalid_emails:
            response = client.post("/register", json={
                "email": email,
                "phone": "13800138000",
                "name": "Test User",
                "password": "password123",
                "confirm_password": "password123"
            })
            assert response.status_code == 422, f"Email {email} should be invalid"
    
    def test_phone_validation_cases(self):
        """测试各种手机号验证情况"""
        invalid_phones = [
            "123",  # 太短
            "abcdefghijk",  # 非数字
            "12345678901234567890",  # 太长
            "+86-138-0013-8000",  # 包含特殊字符
            "138 0013 8000"  # 包含空格
        ]
        
        for phone in invalid_phones:
            response = client.post("/register", json={
                "email": "test@example.com",
                "phone": phone,
                "name": "Test User",
                "password": "password123",
                "confirm_password": "password123"
            })
            assert response.status_code == 422, f"Phone {phone} should be invalid"
    
    def test_password_validation_cases(self):
        """测试各种密码验证情况"""
        invalid_passwords = [
            "123",  # 太短
            "a" * 129,  # 太长
            "",  # 空密码
            "   "  # 只有空格
        ]
        
        for password in invalid_passwords:
            response = client.post("/register", json={
                "email": "test@example.com",
                "phone": "13800138000",
                "name": "Test User",
                "password": password,
                "confirm_password": password
            })
            assert response.status_code == 422, f"Password '{password}' should be invalid"