"""认证API真实端点单元测试"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import HTTPException

from main import app
from services.auth_service import AuthService, AuthResult, LoginCredentials, RegisterData
from shared.exceptions import (
    AuthenticationError,
    ValidationError,
    UserNotFoundError,
    UserAlreadyExistsError
)
from shared.container import get_auth_service





class TestAuthAPIReal:
    """认证API真实端点测试"""
    
    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)
        self.mock_auth_service = Mock(spec=AuthService)
        # 使用dependency_overrides来mock依赖注入
        app.dependency_overrides[get_auth_service] = lambda: self.mock_auth_service
    
    def teardown_method(self):
        """测试后置清理"""
        # 清理dependency_overrides
        app.dependency_overrides.clear()

    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_success(self):
        """测试登录成功"""
        # 设置mock认证服务
        self.mock_auth_service.authenticate = AsyncMock()
        self.mock_auth_service.token_service = Mock()
        self.mock_auth_service.token_service.create_refresh_token.return_value = "refresh_token_123"
        
        # 模拟成功的认证结果
        auth_result = AuthResult(
            success=True,
            token="access_token_123",
            user={
                "id": 1,
                "username": "testuser",
                "email": "test@example.com",
                "name": "Test User"
            },
            error_message=None
        )
        self.mock_auth_service.authenticate.return_value = auth_result
        
        # 发送登录请求
        login_data = {
            "identifier": "test@example.com",
            "password": "testpassword",
            "remember_me": False
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["access_token"] == "access_token_123"
        assert data["refresh_token"] == "refresh_token_123"
        assert data["user"]["email"] == "test@example.com"
        
        # 验证服务调用
        self.mock_auth_service.authenticate.assert_called_once()
        call_args = self.mock_auth_service.authenticate.call_args[0][0]
        assert call_args.email == "test@example.com"
        assert call_args.password == "testpassword"

    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_invalid_email_format(self):
        """测试登录时邮箱格式无效"""
        login_data = {
            "identifier": "invalid_email",
            "password": "testpassword"
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "只支持邮箱登录" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_authentication_failed(self):
        """测试登录认证失败"""
        self.mock_auth_service.authenticate = AsyncMock()
        
        # 模拟认证失败
        auth_result = AuthResult(
            success=False,
            token=None,
            user=None,
            error_message="用户名或密码错误"
        )
        self.mock_auth_service.authenticate.return_value = auth_result
        
        login_data = {
            "identifier": "test@example.com",
            "password": "wrongpassword"
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "用户名或密码错误" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_register_success(self):
        """测试注册成功"""
        self.mock_auth_service.register_user = AsyncMock()
        
        # 模拟成功的注册结果
        register_result = Mock()
        register_result.access_token = "access_token_123"
        register_result.refresh_token = "refresh_token_123"
        register_result.expires_in = 3600
        register_result.user = {
            "id": 1,
            "username": "newuser",
            "email": "new@example.com",
            "name": "New User"
        }
        self.mock_auth_service.register_user.return_value = register_result
        
        # 发送注册请求
        register_data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "agree_terms": True,
            "user_type": "developer"
        }
        response = self.client.post("/api/v1/auth/register", json=register_data)
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["access_token"] == "access_token_123"
        assert data["user"]["email"] == "new@example.com"
        
        # 验证服务调用
        self.mock_auth_service.register_user.assert_called_once()
        call_args = self.mock_auth_service.register_user.call_args[0][0]
        assert call_args.username == "newuser"
        assert call_args.email == "new@example.com"
        assert call_args.password == "StrongPass123!"

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
        response = self.client.post("/api/v1/auth/register", json=register_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "密码确认不匹配" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_register_user_already_exists(self, mock_get_auth_service, client):
        """测试注册时用户已存在"""
        mock_auth_service = Mock()
        mock_auth_service.register_user = AsyncMock()
        mock_auth_service.register_user.side_effect = UserAlreadyExistsError("用户已存在")
        mock_get_auth_service.return_value = mock_auth_service
        
        register_data = {
            "username": "existinguser",
            "email": "existing@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "agree_terms": True
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        
        assert response.status_code == 409
        data = response.json()
        assert "用户已存在" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_refresh_token_success(self, mock_get_auth_service, client):
        """测试刷新令牌成功"""
        mock_auth_service = Mock()
        mock_auth_service.refresh_token = AsyncMock()
        
        # 模拟成功的刷新结果
        refresh_result = Mock()
        refresh_result.access_token = "new_access_token_123"
        refresh_result.refresh_token = "new_refresh_token_123"
        refresh_result.expires_in = 3600
        refresh_result.user = {
            "id": 1,
            "username": "testuser",
            "email": "test@example.com"
        }
        mock_auth_service.refresh_token.return_value = refresh_result
        mock_get_auth_service.return_value = mock_auth_service
        
        refresh_data = {
            "refresh_token": "valid_refresh_token"
        }
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["access_token"] == "new_access_token_123"
        
        mock_auth_service.refresh_token.assert_called_once_with("valid_refresh_token")

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_refresh_token_invalid(self, mock_get_auth_service, client):
        """测试刷新令牌无效"""
        mock_auth_service = Mock()
        mock_auth_service.refresh_token = AsyncMock()
        mock_auth_service.refresh_token.side_effect = AuthenticationError("无效的刷新令牌")
        mock_get_auth_service.return_value = mock_auth_service
        
        refresh_data = {
            "refresh_token": "invalid_refresh_token"
        }
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "无效的刷新令牌" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_logout_success(self, mock_get_auth_service, client):
        """测试登出成功"""
        mock_auth_service = Mock()
        mock_auth_service.logout_user = AsyncMock()
        mock_get_auth_service.return_value = mock_auth_service
        
        headers = {"Authorization": "Bearer valid_access_token"}
        response = client.post("/api/v1/auth/logout", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "登出成功" in data["message"]
        
        mock_auth_service.logout_user.assert_called_once_with("valid_access_token")

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_get_current_user_success(self, mock_get_auth_service, client):
        """测试获取当前用户信息成功"""
        mock_auth_service = Mock()
        mock_auth_service.verify_access_token = AsyncMock()
        
        user_info = {
            "id": 1,
            "username": "testuser",
            "email": "test@example.com",
            "name": "Test User",
            "avatar": None
        }
        mock_auth_service.verify_access_token.return_value = user_info
        mock_get_auth_service.return_value = mock_auth_service
        
        headers = {"Authorization": "Bearer valid_access_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["email"] == "test@example.com"
        
        mock_auth_service.verify_access_token.assert_called_once_with("valid_access_token")

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_get_current_user_invalid_token(self, mock_get_auth_service, client):
        """测试获取当前用户信息时令牌无效"""
        mock_auth_service = Mock()
        mock_auth_service.verify_access_token = AsyncMock()
        mock_auth_service.verify_access_token.side_effect = AuthenticationError("无效的访问令牌")
        mock_get_auth_service.return_value = mock_auth_service
        
        headers = {"Authorization": "Bearer invalid_access_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "无效的访问令牌" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_oidc_callback_success(self, client):
        """测试OIDC回调成功"""
        callback_data = {
            "code": "valid_auth_code",
            "state": "test_state"
        }
        response = client.post("/api/v1/auth/oidc/callback", json=callback_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == 3600

    @pytest.mark.unit
    @pytest.mark.auth
    def test_oidc_callback_missing_code(self, client):
        """测试OIDC回调缺少授权码"""
        callback_data = {
            "state": "test_state"
        }
        response = client.post("/api/v1/auth/oidc/callback", json=callback_data)
        
        assert response.status_code == 422  # Pydantic validation error

    @pytest.mark.unit
    @pytest.mark.auth
    def test_oidc_callback_missing_state(self, client):
        """测试OIDC回调缺少state参数"""
        callback_data = {
            "code": "valid_auth_code"
        }
        response = client.post("/api/v1/auth/oidc/callback", json=callback_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "缺少state参数" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_change_password_success(self, mock_get_auth_service, client):
        """测试修改密码成功"""
        mock_auth_service = Mock()
        mock_auth_service.change_password = AsyncMock()
        mock_get_auth_service.return_value = mock_auth_service
        
        change_password_data = {
            "old_password": "oldpassword",
            "new_password": "NewStrongPass123!",
            "confirm_password": "NewStrongPass123!"
        }
        headers = {"Authorization": "Bearer valid_access_token"}
        response = client.post("/api/v1/auth/change-password", json=change_password_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "密码修改成功" in data["message"]
        
        mock_auth_service.change_password.assert_called_once_with(
            "valid_access_token",
            "oldpassword",
            "NewStrongPass123!"
        )

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('shared.container.get_auth_service')
    def test_change_password_mismatch(self, mock_get_auth_service, client):
        """测试修改密码时新密码确认不匹配"""
        change_password_data = {
            "old_password": "oldpassword",
            "new_password": "NewStrongPass123!",
            "confirm_password": "DifferentPass123!"
        }
        headers = {"Authorization": "Bearer valid_access_token"}
        response = client.post("/api/v1/auth/change-password", json=change_password_data, headers=headers)
        
        assert response.status_code == 400
        data = response.json()
        assert "新密码确认不匹配" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_login_missing_fields(self, client):
        """测试登录时缺少必填字段"""
        # 缺少密码
        login_data = {
            "identifier": "test@example.com"
        }
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 422  # Pydantic validation error
        
        # 缺少标识符
        login_data = {
            "password": "testpassword"
        }
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 422  # Pydantic validation error

    @pytest.mark.unit
    @pytest.mark.auth
    def test_register_missing_fields(self, client):
        """测试注册时缺少必填字段"""
        # 缺少用户名
        register_data = {
            "email": "new@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "agree_terms": True
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 422  # Pydantic validation error
        
        # 缺少邮箱
        register_data = {
            "username": "newuser",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "agree_terms": True
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 422  # Pydantic validation error