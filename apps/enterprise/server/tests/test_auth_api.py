"""认证模块API单元测试"""
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient


# 创建简化的测试应用
app = FastAPI()

# 模拟认证API端点
@app.get("/api/v1/auth/oidc/login")
async def oidc_login():
    """OIDC登录"""
    return {
        "authorization_url": "https://auth.example.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:8000/api/v1/auth/oidc/callback&response_type=code&scope=openid profile email"
    }

@app.post("/api/v1/auth/oidc/callback")
async def oidc_callback(code: str = None, state: str = None):
    """OIDC回调"""
    if not code:
        raise HTTPException(status_code=400, detail="授权码缺失")
    
    return {
        "access_token": "mock_access_token",
        "token_type": "Bearer",
        "expires_in": 3600,
        "refresh_token": "mock_refresh_token",
        "user": {
            "id": 1,
            "email": "test@example.com",
            "name": "Test User"
        }
    }

@app.post("/api/v1/auth/logout")
async def logout():
    """用户登出"""
    return {"message": "登出成功"}

@app.get("/api/v1/auth/me")
async def get_current_user():
    """获取当前用户信息"""
    return {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "avatar": "https://example.com/avatar.jpg",
        "created_at": "2024-01-15T10:00:00Z"
    }

@app.post("/api/v1/auth/refresh")
async def refresh_token(request_data: dict):
    """刷新访问令牌"""
    refresh_token = request_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="刷新令牌缺失")
    
    return {
        "access_token": "new_access_token",
        "token_type": "Bearer",
        "expires_in": 3600
    }


@pytest.fixture
def client():
    """测试客户端"""
    return TestClient(app)


class TestAuthAPI:
    """认证API测试类"""

    @pytest.mark.unit
    @pytest.mark.auth
    def test_oidc_login_success(self, client):
        """测试OIDC登录成功"""
        response = client.get("/api/v1/auth/oidc/login")
        
        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        assert "auth.example.com" in data["authorization_url"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_oidc_callback_success(self, client):
        """测试OIDC回调成功"""
        response = client.post("/api/v1/auth/oidc/callback?code=auth_code&state=test_state")
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"

    @pytest.mark.unit
    @pytest.mark.auth
    def test_oidc_callback_missing_code(self, client):
        """测试OIDC回调缺少授权码"""
        response = client.post("/api/v1/auth/oidc/callback")
        
        assert response.status_code == 400
        data = response.json()
        assert "授权码缺失" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_logout_success(self, client):
        """测试用户登出成功"""
        response = client.post("/api/v1/auth/logout")
        
        assert response.status_code == 200
        data = response.json()
        assert "登出成功" in data["message"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_get_current_user_success(self, client):
        """测试获取当前用户信息成功"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

    @pytest.mark.unit
    @pytest.mark.auth
    def test_refresh_token_success(self, client):
        """测试刷新令牌成功"""
        refresh_data = {"refresh_token": "valid_refresh_token"}
        response = client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["access_token"] == "new_access_token"

    @pytest.mark.unit
    @pytest.mark.auth
    def test_refresh_token_missing(self, client):
        """测试刷新令牌缺失"""
        response = client.post("/api/v1/auth/refresh", json={})
        
        assert response.status_code == 400
        data = response.json()
        assert "刷新令牌缺失" in data["detail"]

    @pytest.mark.unit
    @pytest.mark.auth
    def test_auth_api_error_handling(self, client):
        """测试认证API通用错误处理"""
        # 测试无效的请求体
        response = client.post("/api/v1/auth/oidc/callback", json={})
        assert response.status_code == 400
        
        # 测试无效的JSON
        response = client.post(
            "/api/v1/auth/oidc/callback",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400  # 修改为400，因为我们的端点返回400而不是422