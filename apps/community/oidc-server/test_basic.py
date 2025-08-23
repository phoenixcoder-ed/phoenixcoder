import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """测试根端点"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "PhoenixCoder OIDC Server"}

def test_openid_configuration():
    """测试 OIDC 发现端点"""
    response = client.get("/.well-known/openid_configuration")
    assert response.status_code == 200
    
    config = response.json()
    assert config["issuer"] == "http://localhost:8001"
    assert "authorization_endpoint" in config
    assert "token_endpoint" in config
    assert "userinfo_endpoint" in config
    assert "jwks_uri" in config

def test_authorize_endpoint():
    """测试授权端点"""
    response = client.get("/authorize", params={
        "response_type": "code",
        "client_id": "test-client",
        "redirect_uri": "http://localhost:3000/callback",
        "scope": "openid profile email"
    })
    
    assert response.status_code == 200
    assert "PhoenixCoder OIDC Login" in response.text

def test_jwks_endpoint():
    """测试 JWKS 端点"""
    response = client.get("/.well-known/jwks.json")
    assert response.status_code == 200
    
    jwks = response.json()
    assert "keys" in jwks
    assert len(jwks["keys"]) == 1
    assert jwks["keys"][0]["kty"] == "oct"
    assert jwks["keys"][0]["alg"] == "HS256"

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 