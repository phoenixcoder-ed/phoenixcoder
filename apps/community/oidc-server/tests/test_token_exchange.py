import pytest
import json
import time
import jwt
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app, db_service, JWT_SECRET, JWT_ALGORITHM
from models import User, UserType
from database import DatabaseService

client = TestClient(app)

@pytest.mark.unit
@pytest.mark.auth
class TestTokenExchange:
    """令牌交换功能单元测试"""
    
    def setup_method(self):
        """每个测试方法执行前的设置"""
        # 测试前的设置
        pass
    
    @patch('main.db_service')
    def test_token_exchange_success(self, mock_db):
        """测试令牌交换成功"""
        # Mock数据库服务
        mock_db.get_auth_code.return_value = {
            "code": "test_code",
            "client_id": "test-client",
            "user_sub": "user123",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "expires_at": int(time.time()) + 600
        }
        
        mock_db.get_user_by_sub.return_value = User(
            id="user123",
            sub="user123",
            email="test@example.com",
            name="Test User",
            password="hashed_password123",
            user_type=UserType.PROGRAMMER,
            phone="13800138000",
            avatar="https://example.com/avatar.jpg",
            is_active=True,
            last_login_at=None,
            login_count=0
        )
        
        # 模拟有效的授权码（实际实现中通过数据库服务管理）
        auth_code = "valid_auth_code_123"
        
        # 发送令牌交换请求
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert token_response.status_code == 200
        token_data = token_response.json()
        
        # 验证响应结构
        assert "access_token" in token_data
        assert "id_token" in token_data
        assert "token_type" in token_data
        assert "expires_in" in token_data
        assert "scope" in token_data
        
        assert token_data["token_type"] == "Bearer"
        assert token_data["expires_in"] == 3600
        assert token_data["scope"] == "openid profile email"
        
        # 验证access_token
        access_token_payload = jwt.decode(
            token_data["access_token"], 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        assert access_token_payload["sub"] == "user123"
        assert access_token_payload["scope"] == "openid profile email"
        assert access_token_payload["token_type"] == "access_token"
        
        # 验证id_token
        id_token_payload = jwt.decode(
            token_data["id_token"], 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        assert id_token_payload["sub"] == "user123"
        assert id_token_payload["email"] == "test@example.com"
        assert id_token_payload["name"] == "Test User"
        assert id_token_payload["aud"] == "test-client"
        
        # 注意：实际实现中应验证授权码已从数据库中删除
    
    def test_token_exchange_invalid_grant_type(self):
        """测试无效的grant_type"""
        response = client.post("/token", data={
            "grant_type": "invalid_grant",
            "code": "test_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "unsupported_grant_type"
    
    def test_token_exchange_missing_code(self):
        """测试缺少授权码"""
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "invalid_request"
        assert "Missing authorization code" in data["error_description"]
    
    @patch('main.db_service.get_auth_code')
    @patch('main.db_service.get_application_by_client_id')
    def test_token_exchange_invalid_code(self, mock_get_app, mock_get_auth_code):
        """测试无效的授权码"""
        mock_get_auth_code.return_value = None
        mock_get_app.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "invalid_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "invalid_grant"
        assert "Invalid authorization code" in data["error_description"]
    
    @patch('main.db_service.get_auth_code')
    @patch('main.db_service.get_application_by_client_id')
    def test_token_exchange_expired_code(self, mock_get_app, mock_get_auth_code):
        """测试过期的授权码"""
        # 模拟过期的授权码
        mock_get_auth_code.return_value = {
            "user_sub": "test_user",
            "client_id": "test_client",
            "scope": "openid profile",
            "expires_at": time.time() - 3600,  # 1小时前过期
            "used": False
        }
        mock_get_app.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "expired_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "invalid_grant"
        assert data["error_description"] == "Authorization code has expired"
    
    @patch('main.db_service.get_auth_code')
    @patch('main.db_service.get_application_by_client_id')
    def test_token_exchange_client_id_mismatch(self, mock_get_app, mock_get_auth_code):
        """测试客户端ID不匹配"""
        mock_get_auth_code.return_value = {
            "user_sub": "test_user",
            "client_id": "different_client",  # 不同的client_id
            "scope": "openid profile",
            "expires_at": time.time() + 3600,
            "used": False
        }
        mock_get_app.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "test_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "invalid_client"
        assert data["error_description"] == "Client ID mismatch"
    
    @patch('main.db_service.get_auth_code')
    @patch('main.db_service.get_application_by_client_id')
    def test_token_exchange_redirect_uri_mismatch(self, mock_get_app, mock_get_auth_code):
        """测试重定向URI不匹配"""
        mock_get_auth_code.return_value = {
            "user_sub": "test_user",
            "client_id": "test_client",
            "scope": "openid profile",
            "expires_at": time.time() + 3600,
            "used": False
        }
        mock_get_app.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"  # 与请求的不匹配
        }
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "test_code",
            "redirect_uri": "http://different.com/callback",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "invalid_grant"
        assert data["error_description"] == "Redirect URI mismatch"
    
    @patch('main.db_service')
    def test_token_exchange_user_not_found(self, mock_db):
        """测试用户不存在"""
        # 模拟用户不存在
        mock_db.get_user_by_id.return_value = None
        
        # 模拟授权码（实际实现中通过数据库服务管理）
        auth_code = "auth_code_user_not_found"
        
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert token_response.status_code == 400
        assert "invalid_grant" in token_response.json()["error"]
    
    @patch('main.db_service')
    def test_token_exchange_inactive_user(self, mock_db):
        """测试非活跃用户"""
        # 模拟非活跃用户
        inactive_user = User(
            id="inactive_user",
            sub="inactive_user",
            email="inactive@example.com",
            name="Inactive User",
            password="Password123!",
            user_type=UserType.REGULAR,
            phone="13800138001",
            avatar="https://example.com/avatar.jpg",
            is_active=False,  # 非活跃
            last_login_at=None,
            login_count=0
        )
        mock_db.get_user_by_id.return_value = inactive_user
        
        # 模拟授权码（实际实现中通过数据库服务管理）
        auth_code = "auth_code_inactive_user"
        
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert token_response.status_code == 400
        assert "invalid_grant" in token_response.json()["error"]
    
    @patch('main.db_service.get_auth_code')
    def test_token_exchange_database_error(self, mock_get_auth_code):
        """测试数据库错误"""
        # 模拟数据库错误
        mock_get_auth_code.side_effect = Exception("Database connection error")
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "valid_auth_code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 500
    
    @patch('main.db_service.get_auth_code')
    @patch('main.db_service.get_application_by_client_id')
    @patch('main.db_service.get_user_by_sub')
    @patch('main.db_service.mark_auth_code_as_used')
    def test_token_exchange_with_different_scopes(self, mock_mark_used, mock_get_user, mock_get_app, mock_get_auth_code):
        """测试不同scope的令牌交换"""
        # 模拟授权码数据
        mock_get_auth_code.return_value = {
            "user_sub": "user456",
            "client_id": "test_client",
            "scope": "openid",  # 仅包含openid scope
            "expires_at": time.time() + 3600,
            "used": False
        }
        
        # 模拟应用数据
        mock_get_app.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        
        # 模拟用户数据
        test_user = User(
            id="user456",
            sub="user456",
            email="scope_test@example.com",
            name="Scope Test User",
            password="Password123!",
            user_type=UserType.REGULAR,
            phone="13800138002",
            avatar="https://example.com/avatar.jpg",
            is_active=True,
            last_login_at=None,
            login_count=0
        )
        mock_get_user.return_value = test_user
        
        response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "auth_code_openid_only",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "client_secret": "test_secret"
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        assert response.status_code == 200
        token_data = response.json()
        
        # 验证id_token只包含基本信息
        id_token_payload = jwt.decode(
            token_data["id_token"], 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        assert id_token_payload["sub"] == "user456"
        assert "email" not in id_token_payload  # 没有email scope
        assert "name" not in id_token_payload   # 没有profile scope
        assert "phone" not in id_token_payload  # 没有phone scope
    
    @pytest.mark.skip(reason="微信公众平台未开通，暂时跳过微信登录")
    @patch('main.db_service')
    def test_token_exchange_wechat_user(self, mock_db):
        """测试微信用户的令牌交换"""
        # 模拟微信用户数据
        wechat_user = User(
            id="wechat_user_123",
            sub="wechat_user_123",
            name="微信用户",
            password="Password123!",
            user_type=UserType.PROGRAMMER,
            email="wechatuser@example.com",
            phone="13800138003",
            avatar="http://example.com/avatar.jpg",
            is_active=True,
            last_login_at=None,
            login_count=0
        )
        mock_db.get_user_by_id.return_value = wechat_user
        
        # 模拟授权码（实际实现中通过数据库服务管理）
        auth_code = "auth_code_wechat_user"
        
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert token_response.status_code == 200
        token_data = token_response.json()
        
        # 验证id_token包含微信用户信息
        id_token_payload = jwt.decode(
            token_data["id_token"], 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        assert id_token_payload["sub"] == "wechat_user_123"
        assert id_token_payload["name"] == "微信用户"
        assert id_token_payload["picture"] == "http://example.com/avatar.jpg"
        assert "email" not in id_token_payload  # 微信用户可能没有邮箱

@pytest.mark.unit
@pytest.mark.auth
class TestUserInfoEndpoint:
    """用户信息端点单元测试"""
    
    @patch('main.db_service')
    def test_userinfo_success(self, mock_db):
        """测试获取用户信息成功"""
        # 模拟用户数据
        test_user = User(
            id="user789",
            sub="user789",
            email="userinfo@example.com",
            name="UserInfo Test",
            password="Password123!",
            user_type=UserType.REGULAR,
            phone="13800138004",
            avatar="http://example.com/avatar.jpg",
            is_active=True,
            last_login_at=None,
            login_count=0
        )
        mock_db.get_user_by_id.return_value = test_user
        
        # 创建有效的access_token
        access_token_payload = {
            "sub": "user789",
            "scope": "openid profile email phone",
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
            "aud": "test-client"
        }
        access_token = jwt.encode(access_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # 发送用户信息请求
        userinfo_response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert userinfo_response.status_code == 200
        userinfo_data = userinfo_response.json()
        
        assert userinfo_data["sub"] == "user789"
        assert userinfo_data["email"] == "userinfo@example.com"
        assert userinfo_data["name"] == "UserInfo Test"
        assert userinfo_data["phone"] == "13800138004"
        assert userinfo_data["picture"] == "http://example.com/avatar.jpg"
    
    def test_userinfo_missing_authorization(self):
        """测试缺少Authorization头"""
        userinfo_response = client.get("/userinfo")
        
        assert userinfo_response.status_code == 401
        assert "Missing authorization header" in userinfo_response.json()["detail"]
    
    def test_userinfo_invalid_token_format(self):
        """测试无效的token格式"""
        userinfo_response = client.get("/userinfo", headers={
            "Authorization": "InvalidFormat token123"
        })
        
        assert userinfo_response.status_code == 401
        assert "Invalid authorization header format" in userinfo_response.json()["detail"]
    
    def test_userinfo_invalid_token(self):
        """测试无效的token"""
        userinfo_response = client.get("/userinfo", headers={
            "Authorization": "Bearer invalid_token_string"
        })
        
        assert userinfo_response.status_code == 401
        assert "Invalid token" in userinfo_response.json()["detail"]
    
    @patch('jwt.decode')
    def test_userinfo_expired_token(self, mock_jwt_decode):
        """测试过期的token"""
        # 模拟token过期错误
        from jwt.exceptions import ExpiredSignatureError
        mock_jwt_decode.side_effect = ExpiredSignatureError("Token has expired")
        
        response = client.get("/userinfo", headers={
            "Authorization": "Bearer expired_token"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Token has expired" in data["detail"]
    
    @patch('jwt.decode')
    def test_userinfo_wrong_token_type(self, mock_jwt_decode):
        """测试错误的token类型"""
        # 模拟token类型错误
        from jwt.exceptions import InvalidTokenError
        mock_jwt_decode.side_effect = InvalidTokenError("Invalid token type")
        
        response = client.get("/userinfo", headers={
            "Authorization": "Bearer id_token_instead_of_access_token"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid token" in data["detail"]
    
    @patch('main.db_service.get_user_by_id')
    def test_userinfo_user_not_found(self, mock_get_user):
        """测试用户不存在"""
        # 创建有效的access_token
        access_token_payload = {
            "sub": "nonexistent_user",
            "scope": "openid profile",
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
            "aud": "test-client"
        }
        access_token = jwt.encode(access_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # 模拟用户不存在
        mock_get_user.return_value = None
        
        response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 404
        data = response.json()
        assert "User not found" in data["detail"]
    
    @patch('main.db_service.get_user_by_id')
    def test_userinfo_limited_scope(self, mock_get_user):
        """测试有限的scope"""
        # 创建只有openid scope的access_token
        limited_token_payload = {
            "sub": "user_limited_scope",
            "scope": "openid",  # 只有openid，没有profile
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
            "aud": "test-client"
        }
        limited_token = jwt.encode(limited_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # 模拟用户数据
        test_user = User(
            id="user_limited_scope",
            sub="user_limited_scope",
            email="limited@example.com",
            name="Limited Scope User",
            password="Password123!",
            user_type=UserType.REGULAR,
            phone="13800138005",
            avatar="http://example.com/avatar.jpg",
            is_active=True,
            last_login_at=None,
            login_count=0
        )
        mock_get_user.return_value = test_user
        
        response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {limited_token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "sub" in data
        # 由于没有profile scope，不应该包含name等信息
        assert "email" not in data
        assert "name" not in data
        assert "phone" not in data