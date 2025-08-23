"""认证API简化测试

测试认证相关的API端点，使用简化的mock方式
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

# 创建一个简化的测试应用
from api.v1.auth import router as auth_router

# 创建测试应用
test_app = FastAPI()
test_app.include_router(auth_router, prefix="/auth")


class TestAuthAPISimple:
    """认证API简化测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.client = TestClient(test_app)
        
        # Mock AuthService
        self.mock_auth_service = Mock()
        self.mock_auth_service.authenticate = AsyncMock()
        self.mock_auth_service.register_user = AsyncMock()
        self.mock_auth_service.token_service = Mock()
        self.mock_auth_service.token_service.create_refresh_token = Mock(return_value="mock_refresh_token")
        
        # 使用dependency_overrides
        from shared.container import get_auth_service
        test_app.dependency_overrides[get_auth_service] = lambda: self.mock_auth_service
    
    def teardown_method(self):
        """测试后清理"""
        test_app.dependency_overrides.clear()
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_success(self):
        """测试登录成功"""
        # 设置mock返回值
        from services.auth_service import AuthResult
        mock_result = AuthResult(
            success=True,
            token="mock_access_token",
            user={"id": 1, "email": "test@example.com", "username": "testuser"},
            error_message=None
        )
        self.mock_auth_service.authenticate.return_value = mock_result
        
        login_data = {
            "identifier": "test@example.com",
            "password": "testpassword",
            "remember_me": False
        }
        
        response = self.client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_invalid_email_format(self):
        """测试登录时邮箱格式无效"""
        login_data = {
            "identifier": "invalid_email",
            "password": "testpassword"
        }
        
        response = self.client.post("/auth/login", json=login_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "邮箱" in data["detail"]
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_authentication_failed(self):
        """测试登录认证失败"""
        # 设置mock返回值
        from services.auth_service import AuthResult
        mock_result = AuthResult(
            success=False,
            token=None,
            user=None,
            error_message="用户名或密码错误"
        )
        self.mock_auth_service.authenticate.return_value = mock_result
        
        login_data = {
            "identifier": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = self.client.post("/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_register_success(self):
        """测试注册成功"""
        # 设置mock返回值
        mock_result = Mock()
        mock_result.access_token = "mock_access_token"
        mock_result.refresh_token = "mock_refresh_token"
        mock_result.expires_in = 3600
        mock_result.user = {"id": 1, "email": "new@example.com", "username": "newuser"}
        
        self.mock_auth_service.register_user.return_value = mock_result
        
        register_data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "agree_terms": True
        }
        
        response = self.client.post("/auth/register", json=register_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_register_password_mismatch(self):
        """测试注册时密码确认不匹配"""
        register_data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "confirm_password": "DifferentPass123!",
            "agree_terms": True
        }
        
        response = self.client.post("/auth/register", json=register_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "密码确认不匹配" in data["detail"]