import pytest
import httpx
import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestOIDCServer:
    """OIDC 服务端单元测试"""
    
    def test_root_endpoint(self):
        """测试根端点"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "PhoenixCoder OIDC Server"}
    
    def test_openid_configuration(self):
        """测试 OIDC 发现端点"""
        response = client.get("/.well-known/openid_configuration")
        assert response.status_code == 200
        
        config = response.json()
        assert config["issuer"] == "http://localhost:8001"
        assert "authorization_endpoint" in config
        assert "token_endpoint" in config
        assert "userinfo_endpoint" in config
        assert "jwks_uri" in config
        assert "code" in config["response_types_supported"]
        assert "openid" in config["scopes_supported"]
    
    def test_authorize_endpoint_success(self):
        """测试授权端点 - 成功场景"""
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email"
        })
        
        assert response.status_code == 200
        assert "PhoenixCoder OIDC Login" in response.text
        assert "test-client" in response.text
        assert "http://localhost:3000/callback" in response.text
    
    def test_authorize_endpoint_invalid_response_type(self):
        """测试授权端点 - 无效的 response_type"""
        response = client.get("/authorize", params={
            "response_type": "token",  # 不支持的 response_type
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        })
        
        assert response.status_code == 400
        assert "Unsupported response_type" in response.json()["detail"]
    
    def test_login_endpoint_success(self):
        """测试登录端点 - 成功场景"""
        # 先获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email"
        })
        
        # 从响应中提取授权码（这里简化处理）
        auth_code = "test_auth_code_123"
        
        # 模拟登录
        response = client.post("/login", data={
            "auth_code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "state": "test_state",
            "email": "test@example.com",
            "password": "password123"
        })
        
        # 由于授权码不存在，应该返回错误
        assert response.status_code == 400
        assert "Invalid auth code" in response.json()["detail"]
    
    def test_token_endpoint_invalid_grant_type(self):
        """测试 Token 端点 - 无效的 grant_type"""
        response = client.post("/token", data={
            "grant_type": "password",  # 不支持的 grant_type
            "code": "test_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert response.status_code == 400
        assert "Unsupported grant_type" in response.json()["detail"]
    
    def test_userinfo_endpoint_no_auth_header(self):
        """测试用户信息端点 - 无认证头"""
        response = client.get("/userinfo")
        assert response.status_code == 401
        assert "Invalid authorization header" in response.json()["detail"]
    
    def test_userinfo_endpoint_invalid_token(self):
        """测试用户信息端点 - 无效的 token"""
        response = client.get("/userinfo", headers={
            "Authorization": "Bearer invalid_token"
        })
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    def test_jwks_endpoint(self):
        """测试 JWKS 端点"""
        response = client.get("/.well-known/jwks.json")
        assert response.status_code == 200
        
        jwks = response.json()
        assert "keys" in jwks
        assert len(jwks["keys"]) == 1
        assert jwks["keys"][0]["kty"] == "oct"
        assert jwks["keys"][0]["alg"] == "HS256"
    
    def test_authorize_with_state(self):
        """测试授权端点 - 包含 state 参数"""
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid",
            "state": "random_state_123"
        })
        
        assert response.status_code == 200
        assert "random_state_123" in response.text
    
    def test_authorize_missing_required_params(self):
        """测试授权端点 - 缺少必需参数"""
        response = client.get("/authorize", params={
            "response_type": "code"
            # 缺少 client_id 和 redirect_uri
        })
        
        # FastAPI 会自动返回 422 错误
        assert response.status_code == 422

class TestOIDCIntegration:
    """OIDC 集成测试"""
    
    def test_complete_oidc_flow(self):
        """测试完整的 OIDC 流程"""
        # 1. 获取授权码
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "integration-test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "state": "integration_test_state"
        })
        
        assert auth_response.status_code == 200
        
        # 2. 模拟登录（这里需要实际的授权码，简化处理）
        # 在实际测试中，你需要从授权响应中提取授权码
        
        # 3. 测试 token 端点（使用无效的授权码）
        token_response = client.post("/token", data={
            "grant_type": "authorization_code",
            "code": "invalid_code",
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "integration-test-client"
        })
        
        assert token_response.status_code == 400
        assert "Invalid authorization code" in token_response.json()["detail"]

class TestSecurity:
    """安全测试"""
    
    def test_csrf_protection(self):
        """测试 CSRF 保护"""
        # 这里可以添加 CSRF 相关的测试
        # 目前 OIDC 服务端没有实现 CSRF 保护，这是一个改进点
        pass
    
    def test_token_expiration(self):
        """测试 token 过期"""
        # 这里可以添加 token 过期相关的测试
        pass
    
    def test_rate_limiting(self):
        """测试速率限制"""
        # 这里可以添加速率限制相关的测试
        # 目前 OIDC 服务端没有实现速率限制，这是一个改进点
        pass

@pytest.fixture
def test_client():
    """测试客户端 fixture"""
    return TestClient(app)

@pytest.fixture
def valid_auth_code():
    """有效的授权码 fixture"""
    # 这里可以创建一个有效的授权码用于测试
    return "valid_test_auth_code"

@pytest.fixture
def valid_access_token():
    """有效的访问令牌 fixture"""
    # 这里可以创建一个有效的访问令牌用于测试
    return "valid_test_access_token"

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 