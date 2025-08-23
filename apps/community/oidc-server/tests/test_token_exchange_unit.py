import pytest
import time
import jwt
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from models import User, UserType
from database import DatabaseService

client = TestClient(app)

@pytest.mark.unit
@pytest.mark.token
class TestTokenExchangeEndpoint:
    """令牌交换端点单元测试"""
    
    @patch('main.db_service')
    def test_token_exchange_success(self, mock_db):
        """测试令牌交换成功"""
        # 模拟有效的授权码和用户
        user = User(
            sub="test_user_123",
            name="测试用户",
            email="test@example.com",
            password="hashed_password_123",
            user_type=UserType.REGULAR,
            is_active=True
        )
        
        # 模拟数据库服务返回有效的授权码信息
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "test_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() + 600,  # 10分钟后过期
            "used": False
        }
        
        # 模拟应用信息
        mock_db.get_application_by_client_id.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "name": "Test App",
            "client_secret": "test_secret",
            "redirect_uris": ["http://localhost:3000/callback"]
        }
        
        mock_db.get_user_by_sub.return_value = user
        mock_db.delete_auth_code.return_value = True
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        assert "id_token" in data
        assert data["token_type"] == "Bearer"
        assert data["expires_in"] == 3600
        
        # 验证调用
        mock_db.get_auth_code.assert_called_once_with("valid_auth_code")
        mock_db.get_application_by_client_id.assert_called_once_with("test_client")
        mock_db.get_user_by_sub.assert_called_once_with("test_user_123")
        mock_db.delete_auth_code.assert_called_once_with("valid_auth_code")
    
    @patch('main.db_service')
    def test_token_exchange_expired_code(self, mock_db):
        """测试令牌交换 - 过期的授权码"""
        # 模拟过期的授权码
        mock_db.get_auth_code.return_value = {
            "code": "expired_auth_code",
            "user_sub": "test_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() - 600,  # 10分钟前过期
            "used": False
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "expired_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_grant" in response.json()["error"]
        assert "Authorization code has expired" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_used_code(self, mock_db):
        """测试令牌交换 - 已使用的授权码"""
        # 模拟已使用的授权码
        mock_db.get_auth_code.return_value = {
            "code": "used_auth_code",
            "user_sub": "test_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() + 600,
            "used": True  # 已使用
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "used_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_grant" in response.json()["error"]
        assert "Authorization code has already been used" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_invalid_code(self, mock_db):
        """测试令牌交换 - 无效的授权码"""
        # 模拟不存在的授权码
        mock_db.get_auth_code.return_value = None
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "invalid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_grant" in response.json()["error"]
        assert "Invalid authorization code" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_client_id_mismatch(self, mock_db):
        """测试令牌交换 - 客户端ID不匹配"""
        # 模拟授权码的客户端ID与请求不匹配
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "test_user_123",
            "client_id": "different_client",  # 不同的客户端ID
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() + 600,
            "used": False
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_client" in response.json()["error"]
        assert "Client ID mismatch" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_redirect_uri_mismatch(self, mock_db):
        """测试令牌交换 - 重定向URI不匹配"""
        # 模拟授权码的重定向URI与请求不匹配
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "test_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://different.com/callback",  # 不同的重定向URI
            "scope": "openid profile",
            "expires_at": time.time() + 600,
            "used": False
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_grant" in response.json()["error"]
        assert "Redirect URI mismatch" in response.json()["error_description"]
    
    def test_token_exchange_missing_grant_type(self):
        """测试令牌交换 - 缺少grant_type"""
        response = client.post("/token", data={
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_request" in response.json()["error"]
        assert "Missing grant_type" in response.json()["error_description"]
    
    def test_token_exchange_unsupported_grant_type(self):
        """测试令牌交换 - 不支持的grant_type"""
        response = client.post("/token", data={
            "grant_type": "password",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "unsupported_grant_type" in response.json()["error"]
        assert "Only authorization_code grant type is supported" in response.json()["error_description"]
    
    def test_token_exchange_missing_code(self):
        """测试令牌交换 - 缺少code"""
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_request" in response.json()["error"]
        assert "Missing authorization code" in response.json()["error_description"]
    
    def test_token_exchange_missing_client_id(self):
        """测试令牌交换 - 缺少client_id"""
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_request" in response.json()["error"]
        assert "Missing client_id" in response.json()["error_description"]
    
    def test_token_exchange_missing_redirect_uri(self):
        """测试令牌交换 - 缺少redirect_uri"""
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client"
        })
        
        assert response.status_code == 400
        assert "invalid_request" in response.json()["error"]
        assert "Missing redirect_uri" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_user_not_found(self, mock_db):
        """测试令牌交换 - 用户不存在"""
        # 模拟有效的授权码但用户不存在
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "nonexistent_user",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() + 600,
            "used": False
        }
        mock_db.get_user_by_sub.return_value = None
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_grant" in response.json()["error"]
        assert "User not found" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_inactive_user(self, mock_db):
        """测试令牌交换 - 非活跃用户"""
        # 模拟非活跃用户
        inactive_user = User(
            sub="inactive_user_123",
            name="非活跃用户",
            email="inactive@example.com",
            password="hashed_password_123",
            user_type=UserType.REGULAR,
            is_active=False  # 非活跃
        )
        
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "inactive_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() + 600,
            "used": False
        }
        mock_db.get_user_by_sub.return_value = inactive_user
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "invalid_grant" in response.json()["error"]
        assert "User account is inactive" in response.json()["error_description"]
    
    @patch('main.db_service')
    def test_token_exchange_database_error(self, mock_db):
        """测试令牌交换 - 数据库错误"""
        # 模拟数据库错误
        mock_db.get_auth_code.side_effect = Exception("Database connection failed")
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 500
        data = response.json()
        assert "Database" in data["detail"]
    
    @patch('main.db_service')
    @patch('main.JWT_SECRET', 'your-jwt-secret-key')
    def test_token_exchange_with_different_scopes(self, mock_db):
        """测试令牌交换 - 不同的scope"""
        user = User(
            sub="test_user_123",
            name="测试用户",
            email="test@example.com",
            password="hashed_password_123",
            user_type=UserType.REGULAR,
            is_active=True
        )
        
        # 模拟只有openid scope的授权码
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "test_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid",  # 只有openid
            "expires_at": time.time() + 600,
            "used": False
        }
        mock_db.get_application_by_client_id.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        mock_db.get_user_by_sub.return_value = user
        mock_db.delete_auth_code.return_value = True
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        print(f"Response status code: {response.status_code}")
        print(f"Response content: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["scope"] == "openid"
    
    @pytest.mark.skip(reason="微信公众平台未开通，暂时跳过微信用户测试")
    @patch('main.db_service')
    def test_token_exchange_wechat_user(self, mock_db):
        """测试微信用户的令牌交换"""
        # 模拟微信用户
        wechat_user = User(
            sub="wechat_user_123",
            name="微信用户",
            password="hashed_password_wechat123",
            user_type=UserType.PROGRAMMER,
            email="wechatuser@example.com",
            avatar="http://example.com/avatar.jpg",
            is_active=True
        )
        
        mock_db.get_auth_code.return_value = {
            "code": "valid_auth_code",
            "user_sub": "wechat_user_123",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "expires_at": time.time() + 600,
            "used": False
        }
        mock_db.get_user_by_sub.return_value = wechat_user
        mock_db.delete_auth_code.return_value = True
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["scope"] == "openid profile"
    
    def test_token_exchange_empty_parameters(self):
        """测试令牌交换 - 空参数"""
        response = client.post("/token", data={
            "grant_type": "",
            "code": "",
            "client_id": "",
            "redirect_uri": ""
        })
        
        assert response.status_code == 400
        assert "invalid_request" in response.json()["error"]
    
    def test_token_exchange_invalid_content_type(self):
        """测试令牌交换 - 无效的Content-Type"""
        response = client.post("/token", json={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        # OAuth2规范要求使用application/x-www-form-urlencoded
        assert response.status_code == 400
        assert "invalid_request" in response.json()["error"]

@pytest.mark.unit
@pytest.mark.userinfo
class TestUserInfoEndpoint:
    """用户信息端点单元测试"""
    
    @patch('main.db_service')
    @patch('main.JWT_SECRET', 'your-jwt-secret-key')
    def test_userinfo_success(self, mock_db):
        """测试获取用户信息成功"""
        user = User(
            sub="test_user_123",
            name="测试用户",
            email="test@example.com",
            password="hashed_password_123",
            user_type=UserType.REGULAR,
            is_active=True
        )
        mock_db.get_user_by_sub.return_value = user
        
        # 模拟有效的访问令牌
        access_token = jwt.encode(
            {"sub": "test_user_123", "scope": "openid profile email"},
            "your-jwt-secret-key",
            algorithm="HS256"
        )
        
        response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["sub"] == "test_user_123"
        assert data["name"] == "测试用户"
        assert data["email"] == "test@example.com"
    
    def test_userinfo_missing_token(self):
        """测试获取用户信息 - 缺少令牌"""
        response = client.get("/userinfo")
        
        assert response.status_code == 401
        assert "Missing authorization header" in response.json()["detail"]
    
    @patch('main.JWT_SECRET', 'your-jwt-secret-key')
    def test_userinfo_invalid_token(self):
        """测试获取用户信息 - 无效令牌"""
        response = client.get("/userinfo", headers={
            "Authorization": "Bearer invalid_token"
        })
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    @patch('main.db_service')
    @patch('main.JWT_SECRET', 'your-jwt-secret-key')
    def test_userinfo_user_not_found(self, mock_db):
        """测试获取用户信息 - 用户不存在"""
        mock_db.get_user_by_sub.return_value = None
        
        # 模拟有效的访问令牌但用户不存在
        access_token = jwt.encode(
            {"sub": "nonexistent_user", "scope": "openid profile"},
            "your-jwt-secret-key",
            algorithm="HS256"
        )
        
        response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]
    
    def test_userinfo_malformed_authorization_header(self):
        """测试获取用户信息 - 格式错误的授权头"""
        response = client.get("/userinfo", headers={
            "Authorization": "InvalidFormat"
        })
        
        assert response.status_code == 401
        assert "Invalid authorization header format" in response.json()["detail"]
    
    @patch('main.JWT_SECRET', 'your-jwt-secret-key')
    def test_userinfo_expired_token(self):
        """测试获取用户信息 - 过期令牌"""
        # 模拟过期的访问令牌
        expired_token = jwt.encode(
            {
                "sub": "test_user_123",
                "scope": "openid profile",
                "exp": int(time.time()) - 3600  # 1小时前过期
            },
            "your-jwt-secret-key",
            algorithm="HS256"
        )
        
        response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {expired_token}"
        })
        
        assert response.status_code == 401
        assert "Token has expired" in response.json()["detail"]
    
    @patch('main.db_service')
    @patch('main.JWT_SECRET', 'your-jwt-secret-key')
    def test_userinfo_insufficient_scope(self, mock_db):
        """测试获取用户信息 - 权限不足"""
        user = User(
            sub="test_user_123",
            name="测试用户",
            email="test@example.com",
            password="hashed_password_123",
            user_type=UserType.REGULAR,
            is_active=True
        )
        mock_db.get_user_by_sub.return_value = user
        
        # 模拟没有足够权限的访问令牌
        access_token = jwt.encode(
            {"sub": "test_user_123", "scope": "read"},  # 没有openid权限
            "your-jwt-secret-key",
            algorithm="HS256"
        )
        
        response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 403
        assert "Insufficient scope" in response.json()["detail"]