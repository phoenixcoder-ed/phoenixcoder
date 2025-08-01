import pytest
import time
import re
from fastapi.testclient import TestClient
from main import app, auth_codes, users

client = TestClient(app)

class TestAuthenticationFlow:
    """认证流程测试"""
    
    def setup_method(self):
        """每个测试方法执行前的设置"""
        # 清空授权码存储
        auth_codes.clear()
    
    def test_complete_authentication_flow(self):
        """测试完整的认证流程"""
        # 1. 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "state": "test_state_123"
        })
        
        assert auth_response.status_code == 200
        assert "PhoenixCoder OIDC Login" in auth_response.text
        
        # 从响应中提取授权码
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        assert auth_code_match is not None
        auth_code = auth_code_match.group(1)
        
        # 2. 使用有效凭据登录
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "test_state_123",
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert login_response.status_code == 307  # 重定向
        assert "code=" in login_response.headers["location"]
        assert "state=test_state_123" in login_response.headers["location"]
        
        # 从重定向 URL 中提取授权码
        redirect_url = login_response.headers["location"]
        code_match = re.search(r'code=([^&]+)', redirect_url)
        assert code_match is not None
        final_auth_code = code_match.group(1)
        
        # 3. 用授权码换取 token
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": final_auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert token_response.status_code == 200
        token_data = token_response.json()
        
        assert "access_token" in token_data
        assert "id_token" in token_data
        assert "token_type" in token_data
        assert "expires_in" in token_data
        assert token_data["token_type"] == "Bearer"
        assert token_data["expires_in"] == 3600
        
        # 4. 使用访问令牌获取用户信息
        userinfo_response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {token_data['access_token']}"
        })
        
        assert userinfo_response.status_code == 200
        user_data = userinfo_response.json()
        
        assert "sub" in user_data
        assert "email" in user_data
        assert "name" in user_data
        assert user_data["email"] == "test@example.com"
        assert user_data["name"] == "Test User"
    
    def test_invalid_credentials(self):
        """测试无效凭据"""
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
            "email": "test@example.com",
            "password": "wrong_password"
        })
        
        assert login_response.status_code == 401
        assert "Invalid credentials" in login_response.json()["detail"]
    
    def test_expired_auth_code(self):
        """测试过期的授权码"""
        # 手动创建一个过期的授权码
        expired_code = "expired_code_123"
        auth_codes[expired_code] = {
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid",
            "state": "",
            "expires_at": time.time() - 60  # 1分钟前过期
        }
        
        # 尝试使用过期的授权码
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": expired_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert token_response.status_code == 400
        assert "Authorization code expired" in token_response.json()["detail"]
    
    def test_invalid_client_id(self):
        """测试无效的客户端 ID"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "valid-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 登录
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "email": "test@example.com",
            "password": "password123"
        })
        
        redirect_url = login_response.headers["location"]
        code_match = re.search(r'code=([^&]+)', redirect_url)
        final_auth_code = code_match.group(1)
        
        # 使用错误的客户端 ID 换取 token
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": final_auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "wrong-client"  # 错误的客户端 ID
        })
        
        assert token_response.status_code == 400
        assert "Invalid client_id or redirect_uri" in token_response.json()["detail"]
    
    def test_invalid_redirect_uri(self):
        """测试无效的重定向 URI"""
        # 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid"
        })
        
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
        auth_code = auth_code_match.group(1)
        
        # 登录
        login_response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "",
            "email": "test@example.com",
            "password": "password123"
        })
        
        redirect_url = login_response.headers["location"]
        code_match = re.search(r'code=([^&]+)', redirect_url)
        final_auth_code = code_match.group(1)
        
        # 使用错误的重定向 URI 换取 token
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": final_auth_code,
            "redirect_uri": "http://localhost:3000/wrong-callback",  # 错误的重定向 URI
            "client_id": "test-client"
        })
        
        assert token_response.status_code == 400
        assert "Invalid client_id or redirect_uri" in token_response.json()["detail"]

class TestTokenValidation:
    """Token 验证测试"""
    
    def test_valid_token(self):
        """测试有效的 token"""
        # 获取有效的 token
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
            "email": "test@example.com",
            "password": "password123"
        })
        
        redirect_url = login_response.headers["location"]
        code_match = re.search(r'code=([^&]+)', redirect_url)
        final_auth_code = code_match.group(1)
        
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": final_auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        token_data = token_response.json()
        access_token = token_data["access_token"]
        
        # 验证 token
        userinfo_response = client.get("/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert userinfo_response.status_code == 200
        user_data = userinfo_response.json()
        assert user_data["email"] == "test@example.com"
    
    def test_invalid_token_format(self):
        """测试无效的 token 格式"""
        response = client.get("/userinfo", headers={
            "Authorization": "InvalidFormat token123"
        })
        
        assert response.status_code == 401
        assert "Invalid authorization header" in response.json()["detail"]
    
    def test_malformed_token(self):
        """测试格式错误的 token"""
        response = client.get("/userinfo", headers={
            "Authorization": "Bearer malformed.token.here"
        })
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 