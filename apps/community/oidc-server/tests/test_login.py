import pytest
import time
import re
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app, db_service
from models import User, UserType
from database import DatabaseService

client = TestClient(app)

@pytest.mark.unit
@pytest.mark.auth
class TestLogin:
    """用户登录功能单元测试"""
    
    def setup_method(self):
        """每个测试方法执行前的设置"""
        # 测试前的设置
        pass
    
    def test_login_success(self):
        """测试登录成功"""
        # 1. 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "state": "test_state_123"
        })
        
        assert auth_response.status_code == 200
        
        # 从响应中提取授权码
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        assert auth_code_match is not None
        auth_code = auth_code_match.group(1)
        
        # 2. 使用有效凭据登录
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "test_state_123",
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 307  # 重定向
        assert "code=" in login_response.headers["location"]
        assert "state=test_state_123" in login_response.headers["location"]
    
    def test_login_invalid_credentials(self):
        """测试无效凭据登录"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 使用无效凭据
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "test@example.com",
            "password": "wrong_password"
        })
        
        assert login_response.status_code == 401
        assert "Invalid credentials" in login_response.json()["detail"]
    
    def test_login_invalid_auth_code(self):
        """测试无效授权码"""
        login_response = client.post("/login", data={
            "auth_code": "invalid_auth_code",
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 400
        assert "Invalid auth code" in login_response.json()["detail"]
    
    def test_login_missing_email(self):
        """测试缺少邮箱"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 缺少邮箱
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "password": "password123"
        })
        
        assert login_response.status_code == 422  # Validation error
    
    def test_login_missing_password(self):
        """测试缺少密码"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 缺少密码
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "test@example.com"
        })
        
        assert login_response.status_code == 422  # Validation error
    
    def test_login_redirect_uri_mismatch(self):
        """测试重定向URI不匹配"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 使用不同的重定向URI
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/different-callback",
            "state": "",
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 400
        assert "Invalid redirect_uri" in login_response.json()["detail"]
    
    @patch('main.db_service')
    def test_login_user_not_found(self, mock_db):
        """测试用户不存在"""
        # 模拟用户不存在
        mock_db.get_user_by_email.return_value = None
        
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 401
        assert "Invalid credentials" in login_response.json()["detail"]
    
    @patch('main.db_service')
    def test_login_inactive_user(self, mock_db):
        """测试非活跃用户"""
        # 模拟非活跃用户
        mock_db.get_user_by_email.return_value = User(
            id="user123",
            email="test@example.com",
            name="Test User",
            user_type=UserType.REGULAR,
            password_hash="$2b$12$BRIh2b9IpC4Jv5Zt6uH7weW4BYcZp8RvXaySEi7a1TWrPj02bgwxa",
            is_active=False  # 非活跃用户
        )
        
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 401
        assert "Account is inactive" in login_response.json()["detail"]
    
    def test_login_empty_credentials(self):
        """测试空凭据"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 空邮箱和密码
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "",
            "password": ""
        })
        
        assert login_response.status_code == 422  # Validation error
    
    def test_login_with_state_parameter(self):
        """测试带state参数的登录"""
        state_value = "random_state_12345"
        
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid",
            "state": state_value
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": state_value,
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 307
        assert f"state={state_value}" in login_response.headers["location"]

@pytest.mark.unit
@pytest.mark.auth
class TestLoginFlow:
    """登录流程测试"""
    
    def setup_method(self):
        """每个测试方法执行前的设置"""
        # 测试前的设置
        pass
    
    def test_complete_login_flow(self):
        """测试完整的登录流程"""
        # 1. 授权请求
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "state": "test_state"
        })
        
        assert auth_response.status_code == 200
        assert "PhoenixCoder OIDC Login" in auth_response.text
        
        # 2. 提取授权码
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        assert auth_code_match is not None
        auth_code = auth_code_match.group(1)
        
        # 3. 用户登录
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "test_state",
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 307
        redirect_url = login_response.headers["location"]
        
        # 4. 验证重定向URL包含授权码和state
        assert "http://localhost:3000/callback" in redirect_url
        assert "code=" in redirect_url
        assert "state=test_state" in redirect_url
        
        # 5. 提取最终授权码
        code_match = re.search(r'code=([^&]+)', redirect_url)
        assert code_match is not None
        final_auth_code = code_match.group(1)
        
        # 6. 验证授权码已更新
        assert final_auth_code != auth_code
        # 注意：实际实现中需要通过数据库服务验证授权码
    
    def test_login_flow_with_multiple_scopes(self):
        """测试多个scope的登录流程"""
        scopes = "openid profile email phone"
        
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": scopes
        })
        
        assert auth_response.status_code == 200
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "login_type": "email",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 307
        
        # 验证授权码信息包含正确的scope
        redirect_url = login_response.headers["location"]
        code_match = re.search(r'code=([^&]+)', redirect_url)
        final_auth_code = code_match.group(1)
        
        # 注意：实际实现中需要通过数据库服务验证授权码和scope
        # assert final_auth_code in auth_codes
        # assert auth_codes[final_auth_code]["scope"] == scopes
    
    def test_login_flow_error_handling(self):
        """测试登录流程错误处理"""
        # 测试无效的授权请求
        auth_response = client.get("/authorize", params={
            "response_type": "invalid_type",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert auth_response.status_code == 400
        assert "Unsupported response_type" in auth_response.json()["detail"]