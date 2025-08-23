import pytest
import time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from models import User, UserType
from database import DatabaseService

client = TestClient(app)

@pytest.mark.unit
@pytest.mark.auth
class TestRegisterEndpoint:
    """注册端点单元测试"""
    
    @patch('main.db_service')
    def test_register_success(self, mock_db):
        """测试注册成功"""
        # 模拟数据库操作
        mock_db.get_user_by_email.return_value = None  # 用户不存在
        mock_db.create_user.return_value = User(
            id="new_user_123",
            email="newuser@example.com",
            name="New User",
            user_type=UserType.REGULAR,
            is_active=True
        )
        
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "name": "New User"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert data["user_id"] == "new_user_123"
        
        # 验证数据库调用
        mock_db.get_user_by_email.assert_called_once_with("newuser@example.com")
        mock_db.create_user.assert_called_once()
    
    @patch('main.db_service')
    def test_register_user_already_exists(self, mock_db):
        """测试用户已存在"""
        # 模拟用户已存在
        mock_db.get_user_by_email.return_value = User(
            id="existing_user",
            email="existing@example.com",
            name="Existing User",
            user_type=UserType.REGULAR,
            is_active=True
        )
        
        response = client.post("/register", json={
            "email": "existing@example.com",
            "password": "SecurePass123!",
            "name": "New User"
        })
        
        assert response.status_code == 400
        assert "User already exists" in response.json()["detail"]
        
        # 验证只调用了查询，没有创建
        mock_db.get_user_by_email.assert_called_once_with("existing@example.com")
        mock_db.create_user.assert_not_called()
    
    def test_register_missing_email(self):
        """测试缺少邮箱"""
        response = client.post("/register", json={
            "password": "SecurePass123!",
            "name": "New User"
        })
        
        assert response.status_code == 422
        assert "field required" in str(response.json())
    
    def test_register_missing_password(self):
        """测试缺少密码"""
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "name": "New User"
        })
        
        assert response.status_code == 422
        assert "field required" in str(response.json())
    
    def test_register_missing_name(self):
        """测试缺少姓名"""
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!"
        })
        
        assert response.status_code == 422
        assert "field required" in str(response.json())
    
    def test_register_invalid_email_format(self):
        """测试无效邮箱格式"""
        response = client.post("/register", json={
            "email": "invalid-email",
            "password": "SecurePass123!",
            "name": "New User"
        })
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert any("email" in str(error).lower() for error in error_detail)
    
    def test_register_weak_password(self):
        """测试弱密码"""
        weak_passwords = [
            "123",           # 太短
            "password",      # 太简单
            "12345678",      # 只有数字
            "abcdefgh",      # 只有字母
        ]
        
        for weak_password in weak_passwords:
            response = client.post("/register", json={
                "email": "newuser@example.com",
                "password": weak_password,
                "name": "New User"
            })
            
            # 根据实际的密码验证逻辑调整状态码
            assert response.status_code in [400, 422]
    
    def test_register_empty_name(self):
        """测试空姓名"""
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "name": ""
        })
        
        assert response.status_code == 422
    
    def test_register_name_too_long(self):
        """测试姓名过长"""
        long_name = "A" * 101  # 假设最大长度为100
        
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "name": long_name
        })
        
        assert response.status_code == 422
    
    @patch('main.db_service')
    def test_register_database_error(self, mock_db):
        """测试数据库错误"""
        # 模拟数据库查询成功，但创建失败
        mock_db.get_user_by_email.return_value = None
        mock_db.create_user.side_effect = Exception("Database connection failed")
        
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "name": "New User"
        })
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    @patch('main.db_service')
    def test_register_check_user_database_error(self, mock_db):
        """测试检查用户时数据库错误"""
        # 模拟检查用户时数据库错误
        mock_db.get_user_by_email.side_effect = Exception("Database connection failed")
        
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "name": "New User"
        })
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    def test_register_invalid_json(self):
        """测试无效JSON"""
        response = client.post("/register", data="invalid json")
        
        assert response.status_code == 422
    
    def test_register_empty_request_body(self):
        """测试空请求体"""
        response = client.post("/register", json={})
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert len(error_detail) >= 3  # email, password, name都缺失
    
    @patch('main.db_service')
    def test_register_special_characters_in_name(self, mock_db):
        """测试姓名中包含特殊字符"""
        mock_db.get_user_by_email.return_value = None
        mock_db.create_user.return_value = User(
            id="new_user_123",
            email="newuser@example.com",
            name="用户-测试_123",
            user_type=UserType.REGULAR,
            is_active=True
        )
        
        response = client.post("/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "name": "用户-测试_123"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User registered successfully"
    
    @patch('main.db_service')
    def test_register_unicode_email(self, mock_db):
        """测试Unicode邮箱"""
        mock_db.get_user_by_email.return_value = None
        mock_db.create_user.return_value = User(
            id="new_user_123",
            email="测试@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            is_active=True
        )
        
        response = client.post("/register", json={
            "email": "测试@example.com",
            "password": "SecurePass123!",
            "name": "Test User"
        })
        
        # 根据实际的邮箱验证逻辑调整期望结果
        assert response.status_code in [201, 422]