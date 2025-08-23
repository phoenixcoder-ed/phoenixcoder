import pytest
import time
import jwt
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, JWT_SECRET, JWT_ALGORITHM
from models import User, UserType
from database import DatabaseService

client = TestClient(app)

@pytest.mark.unit
@pytest.mark.auth
class TestLoginEndpoint:
    """登录端点单元测试"""
    
    @patch('main.db_service')
    def test_login_success(self, mock_db):
        """测试登录成功"""
        # 模拟用户数据
        test_user = User(
            id="user123",
            email="test@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            password_hash="$2b$12$hashed_password",
            is_active=True
        )
        mock_db.get_user_by_email.return_value = test_user
        
        # 模拟密码验证成功
        with patch('main.verify_password', return_value=True):
            response = client.post("/login", json={
                "email": "test@example.com",
                "password": "correct_password"
            })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        
        # 验证数据库调用
        mock_db.get_user_by_email.assert_called_once_with("test@example.com")
    
    @patch('main.db_service')
    def test_login_user_not_found(self, mock_db):
        """测试用户不存在"""
        mock_db.get_user_by_email.return_value = None
        
        response = client.post("/login", json={
            "email": "nonexistent@example.com",
            "password": "any_password"
        })
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
        
        mock_db.get_user_by_email.assert_called_once_with("nonexistent@example.com")
    
    @patch('main.db_service')
    def test_login_wrong_password(self, mock_db):
        """测试密码错误"""
        test_user = User(
            id="user123",
            email="test@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            password_hash="$2b$12$hashed_password",
            is_active=True
        )
        mock_db.get_user_by_email.return_value = test_user
        
        # 模拟密码验证失败
        with patch('main.verify_password', return_value=False):
            response = client.post("/login", json={
                "email": "test@example.com",
                "password": "wrong_password"
            })
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    @patch('main.db_service')
    def test_login_inactive_user(self, mock_db):
        """测试非活跃用户"""
        inactive_user = User(
            id="user123",
            email="test@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            password_hash="$2b$12$hashed_password",
            is_active=False  # 非活跃用户
        )
        mock_db.get_user_by_email.return_value = inactive_user
        
        with patch('main.verify_password', return_value=True):
            response = client.post("/login", json={
                "email": "test@example.com",
                "password": "correct_password"
            })
        
        assert response.status_code == 401
        assert "Account is inactive" in response.json()["detail"]
    
    def test_login_missing_email(self):
        """测试缺少邮箱"""
        response = client.post("/login", json={
            "password": "password123"
        })
        
        assert response.status_code == 422
        assert "field required" in str(response.json())
    
    def test_login_missing_password(self):
        """测试缺少密码"""
        response = client.post("/login", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 422
        assert "field required" in str(response.json())
    
    def test_login_invalid_email_format(self):
        """测试无效邮箱格式"""
        response = client.post("/login", json={
            "email": "invalid-email",
            "password": "password123"
        })
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert any("email" in str(error).lower() for error in error_detail)
    
    def test_login_empty_email(self):
        """测试空邮箱"""
        response = client.post("/login", json={
            "email": "",
            "password": "password123"
        })
        
        assert response.status_code == 422
    
    def test_login_empty_password(self):
        """测试空密码"""
        response = client.post("/login", json={
            "email": "test@example.com",
            "password": ""
        })
        
        assert response.status_code == 422
    
    @patch('main.db_service')
    def test_login_database_error(self, mock_db):
        """测试数据库错误"""
        mock_db.get_user_by_email.side_effect = Exception("Database connection failed")
        
        response = client.post("/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    def test_login_invalid_json(self):
        """测试无效JSON"""
        response = client.post("/login", data="invalid json")
        
        assert response.status_code == 422
    
    def test_login_empty_request_body(self):
        """测试空请求体"""
        response = client.post("/login", json={})
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert len(error_detail) >= 2  # email和password都缺失

@pytest.mark.unit
@pytest.mark.auth
class TestAuthorizationEndpoint:
    """授权端点单元测试"""
    
    @patch('main.db_service')
    def test_authorize_success(self, mock_db):
        """测试授权成功"""
        # 模拟用户数据
        test_user = User(
            id="user123",
            email="test@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            is_active=True
        )
        mock_db.get_user_by_id.return_value = test_user
        
        # 创建有效的access_token
        access_token_payload = {
            "sub": "user123",
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time())
        }
        access_token = jwt.encode(access_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "state": "random_state"
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 302
        location = response.headers["location"]
        assert "code=" in location
        assert "state=random_state" in location
        assert "http://localhost:3000/callback" in location
    
    def test_authorize_missing_response_type(self):
        """测试缺少response_type"""
        response = client.get("/authorize", params={
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        assert response.status_code == 400
        assert "response_type is required" in response.json()["detail"]
    
    def test_authorize_invalid_response_type(self):
        """测试无效的response_type"""
        response = client.get("/authorize", params={
            "response_type": "invalid",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        assert response.status_code == 400
        assert "unsupported_response_type" in response.json()["detail"]
    
    def test_authorize_missing_client_id(self):
        """测试缺少client_id"""
        response = client.get("/authorize", params={
            "response_type": "code",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        assert response.status_code == 400
        assert "client_id is required" in response.json()["detail"]
    
    def test_authorize_missing_redirect_uri(self):
        """测试缺少redirect_uri"""
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "scope": "openid"
        })
        
        assert response.status_code == 400
        assert "redirect_uri is required" in response.json()["detail"]
    
    def test_authorize_invalid_redirect_uri(self):
        """测试无效的redirect_uri"""
        invalid_uris = [
            "not-a-url",
            "ftp://example.com",
            "javascript:alert(1)",
            ""
        ]
        
        for invalid_uri in invalid_uris:
            response = client.get("/authorize", params={
                "response_type": "code",
                "client_id": "test-client",
                "redirect_uri": invalid_uri,
                "scope": "openid"
            })
            
            assert response.status_code == 400
            assert "invalid_redirect_uri" in response.json()["detail"]
    
    def test_authorize_missing_authorization_header(self):
        """测试缺少Authorization头"""
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        assert response.status_code == 401
        assert "Missing Authorization header" in response.json()["detail"]
    
    def test_authorize_invalid_token(self):
        """测试无效token"""
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        }, headers={
            "Authorization": "Bearer invalid_token"
        })
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    def test_authorize_expired_token(self):
        """测试过期token"""
        # 创建过期的access_token
        expired_token_payload = {
            "sub": "user123",
            "token_type": "access_token",
            "exp": int(time.time()) - 60,  # 1分钟前过期
            "iat": int(time.time()) - 3660
        }
        expired_token = jwt.encode(expired_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        }, headers={
            "Authorization": f"Bearer {expired_token}"
        })
        
        assert response.status_code == 401
        assert "Token expired" in response.json()["detail"]
    
    @patch('main.db_service')
    def test_authorize_user_not_found(self, mock_db):
        """测试用户不存在"""
        mock_db.get_user_by_id.return_value = None
        
        # 创建有效的access_token
        access_token_payload = {
            "sub": "nonexistent_user",
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time())
        }
        access_token = jwt.encode(access_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]
    
    @patch('main.db_service')
    def test_authorize_inactive_user(self, mock_db):
        """测试非活跃用户"""
        inactive_user = User(
            id="user123",
            email="test@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            is_active=False
        )
        mock_db.get_user_by_id.return_value = inactive_user
        
        # 创建有效的access_token
        access_token_payload = {
            "sub": "user123",
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time())
        }
        access_token = jwt.encode(access_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 401
        assert "Account is inactive" in response.json()["detail"]
    
    def test_authorize_default_scope(self):
        """测试默认scope"""
        # 创建有效的access_token
        access_token_payload = {
            "sub": "user123",
            "token_type": "access_token",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time())
        }
        access_token = jwt.encode(access_token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        with patch('main.db_service') as mock_db:
            test_user = User(
                id="user123",
                email="test@example.com",
                name="Test User",
                user_type=UserType.REGULAR,
                is_active=True
            )
            mock_db.get_user_by_id.return_value = test_user
            
            response = client.get("/authorize", params={
                "response_type": "code",
                "client_id": "test-client",
                "redirect_uri": "http://localhost:3000/callback"
                # 没有scope参数
            }, headers={
                "Authorization": f"Bearer {access_token}"
            })
            
            assert response.status_code == 302
            location = response.headers["location"]
            assert "code=" in location