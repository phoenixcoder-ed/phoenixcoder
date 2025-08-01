import pytest
import time
from fastapi.testclient import TestClient
from main import app, auth_codes, users

@pytest.fixture(scope="function")
def test_client():
    """测试客户端 fixture"""
    return TestClient(app)

@pytest.fixture(scope="function")
def clean_auth_codes():
    """清理授权码存储的 fixture"""
    auth_codes.clear()
    yield
    auth_codes.clear()

@pytest.fixture(scope="function")
def valid_user():
    """有效用户 fixture"""
    return {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "sub": "user123"
    }

@pytest.fixture(scope="function")
def auth_code_fixture(test_client, clean_auth_codes):
    """获取授权码的 fixture"""
    def _get_auth_code(client_id="test-client", redirect_uri="http://localhost:3000/callback"):
        response = test_client.get("/authorize", params={
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "openid profile email"
        })
        
        # 从响应中提取授权码
        import re
        auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', response.text)
        return auth_code_match.group(1) if auth_code_match else None
    
    return _get_auth_code

@pytest.fixture(scope="function")
def access_token_fixture(test_client, auth_code_fixture, valid_user):
    """获取访问令牌的 fixture"""
    def _get_access_token(client_id="test-client", redirect_uri="http://localhost:3000/callback"):
        # 获取授权码
        auth_code = auth_code_fixture(client_id, redirect_uri)
        
        # 登录
        login_response = test_client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": redirect_uri,
            "state": "",
            "email": valid_user["email"],
            "password": valid_user["password"]
        })
        
        # 从重定向 URL 中提取授权码
        import re
        redirect_url = login_response.headers["location"]
        code_match = re.search(r'code=([^&]+)', redirect_url)
        final_auth_code = code_match.group(1)
        
        # 换取 token
        token_response = test_client.post("/token", data={
            "grant_type": "authorization_code",
            "code": final_auth_code,
            "redirect_uri": redirect_uri,
            "client_id": client_id
        })
        
        token_data = token_response.json()
        return token_data.get("access_token")
    
    return _get_access_token

@pytest.fixture(scope="session")
def test_config():
    """测试配置 fixture"""
    return {
        "issuer": "http://localhost:8001",
        "client_id": "test-client",
        "redirect_uri": "http://localhost:3000/callback",
        "scope": "openid profile email"
    } 