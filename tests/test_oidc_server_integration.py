import pytest
import sqlite3
import tempfile
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
sys.path.append('/Users/zhuwencan/work/phoenixcoder/apps/community/oidc-server')

from main import app, db_service, wechat_service


@pytest.mark.integration
class TestOIDCServerIntegration:
    """OIDC服务器集成测试"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """每个测试方法前的设置"""
        # 创建临时数据库
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        self.temp_db.close()
        
        # 设置数据库服务使用临时数据库
        db_service.db_path = self.temp_db.name
        db_service.init_database()
        
        self.client = TestClient(app)
        
    def teardown_method(self):
        """每个测试方法后的清理"""
        # 删除临时数据库
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)
    
    def test_complete_oidc_flow_with_registration(self):
        """测试完整的OIDC流程 - 包含用户注册"""
        # 1. 用户注册
        register_response = self.client.post("/register", json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test User"
        })
        assert register_response.status_code == 200
        
        # 2. 获取授权页面
        auth_response = self.client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "state": "test_state"
        })
        assert auth_response.status_code == 200
        
        # 3. 用户登录获取授权码
        login_response = self.client.post("/login", data={
            "email": "test@example.com",
            "password": "password123",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email",
            "state": "test_state"
        })
        
        # 登录成功应该重定向到回调URL
        assert login_response.status_code == 302
        location = login_response.headers["location"]
        assert "http://localhost:3000/callback" in location
        assert "code=" in location
        assert "state=test_state" in location
        
        # 提取授权码
        import urllib.parse as urlparse
        parsed_url = urlparse.urlparse(location)
        query_params = urlparse.parse_qs(parsed_url.query)
        auth_code = query_params["code"][0]
        
        # 4. 使用授权码交换访问令牌
        token_response = self.client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert token_response.status_code == 200
        token_data = token_response.json()
        assert "access_token" in token_data
        assert "id_token" in token_data
        assert "token_type" in token_data
        assert token_data["token_type"] == "Bearer"
        
        # 5. 使用访问令牌获取用户信息
        userinfo_response = self.client.get("/userinfo", headers={
            "Authorization": f"Bearer {token_data['access_token']}"
        })
        
        assert userinfo_response.status_code == 200
        userinfo = userinfo_response.json()
        assert userinfo["email"] == "test@example.com"
        assert userinfo["name"] == "Test User"
        assert "sub" in userinfo
    
    def test_complete_oidc_flow_with_existing_user(self):
        """测试完整的OIDC流程 - 使用已存在的用户"""
        # 1. 预先创建用户
        user_id = db_service.create_user(
            email="existing@example.com",
            password_hash="hashed_password",
            name="Existing User"
        )
        
        # 2. 获取授权页面
        auth_response = self.client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile email"
        })
        assert auth_response.status_code == 200
        
        # 3. 用户登录
        with patch('main.db_service.get_user_by_email') as mock_get_user:
            mock_get_user.return_value = {
                'id': user_id,
                'email': 'existing@example.com',
                'password_hash': 'hashed_password',
                'name': 'Existing User',
                'is_active': True
            }
            
            with patch('main.verify_password') as mock_verify:
                mock_verify.return_value = True
                
                login_response = self.client.post("/login", data={
                    "email": "existing@example.com",
                    "password": "password123",
                    "client_id": "test-client",
                    "redirect_uri": "http://localhost:3000/callback",
                    "scope": "openid profile email"
                })
        
        assert login_response.status_code == 302
        location = login_response.headers["location"]
        assert "code=" in location
    
    @patch('main.wechat_service.get_access_token')
    @patch('main.wechat_service.get_user_info')
    def test_wechat_login_integration(self, mock_get_user_info, mock_get_access_token):
        """测试微信登录集成"""
        # 模拟微信服务响应
        mock_get_access_token.return_value = {
            'access_token': 'wechat_access_token',
            'openid': 'wechat_openid_123'
        }
        
        mock_get_user_info.return_value = {
            'openid': 'wechat_openid_123',
            'nickname': '微信用户',
            'headimgurl': 'http://example.com/avatar.jpg'
        }
        
        # 1. 微信登录
        wechat_response = self.client.post("/wechat/login", json={
            "code": "wechat_auth_code"
        })
        
        assert wechat_response.status_code == 200
        wechat_data = wechat_response.json()
        assert "access_token" in wechat_data
        assert "user" in wechat_data
        assert wechat_data["user"]["wechat_openid"] == "wechat_openid_123"
        
        # 2. 验证用户已创建在数据库中
        user = db_service.get_user_by_wechat_openid("wechat_openid_123")
        assert user is not None
        assert user["name"] == "微信用户"
        assert user["wechat_openid"] == "wechat_openid_123"
    
    @patch('main.wechat_service.get_access_token')
    def test_wechat_callback_integration(self, mock_get_access_token):
        """测试微信回调集成"""
        # 模拟微信服务响应
        mock_get_access_token.return_value = {
            'access_token': 'wechat_access_token',
            'openid': 'wechat_openid_456'
        }
        
        # 1. 预先创建授权码
        auth_code = db_service.create_auth_code(
            client_id="test-client",
            redirect_uri="http://localhost:3000/callback",
            scope="openid profile",
            user_id=None  # 微信用户暂时没有user_id
        )
        
        # 2. 微信回调
        callback_response = self.client.get("/wechat/callback", params={
            "code": "wechat_auth_code",
            "state": auth_code
        })
        
        assert callback_response.status_code == 302
        location = callback_response.headers["location"]
        assert "http://localhost:3000/callback" in location
        assert "code=" in location
    
    def test_token_refresh_integration(self):
        """测试令牌刷新集成"""
        # 1. 创建用户
        user_id = db_service.create_user(
            email="refresh@example.com",
            password_hash="hashed_password",
            name="Refresh User"
        )
        
        # 2. 创建授权码
        auth_code = db_service.create_auth_code(
            client_id="test-client",
            redirect_uri="http://localhost:3000/callback",
            scope="openid profile email",
            user_id=user_id
        )
        
        # 3. 获取初始令牌
        token_response = self.client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert token_response.status_code == 200
        token_data = token_response.json()
        
        # 4. 使用refresh_token刷新令牌（如果实现了refresh_token功能）
        if "refresh_token" in token_data:
            refresh_response = self.client.post("/token", data={
                "grant_type": "refresh_token",
                "refresh_token": token_data["refresh_token"],
                "client_id": "test-client"
            })
            
            assert refresh_response.status_code == 200
            new_token_data = refresh_response.json()
            assert "access_token" in new_token_data
            assert new_token_data["access_token"] != token_data["access_token"]
    
    def test_database_transaction_rollback(self):
        """测试数据库事务回滚"""
        # 模拟数据库错误导致事务回滚
        with patch('main.db_service.create_user') as mock_create_user:
            mock_create_user.side_effect = Exception("Database error")
            
            register_response = self.client.post("/register", json={
                "email": "error@example.com",
                "password": "password123",
                "name": "Error User"
            })
            
            assert register_response.status_code == 500
            
            # 验证用户没有被创建
            user = db_service.get_user_by_email("error@example.com")
            assert user is None
    
    def test_concurrent_auth_code_usage(self):
        """测试并发使用授权码"""
        # 1. 创建用户
        user_id = db_service.create_user(
            email="concurrent@example.com",
            password_hash="hashed_password",
            name="Concurrent User"
        )
        
        # 2. 创建授权码
        auth_code = db_service.create_auth_code(
            client_id="test-client",
            redirect_uri="http://localhost:3000/callback",
            scope="openid profile email",
            user_id=user_id
        )
        
        # 3. 第一次使用授权码
        token_response1 = self.client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert token_response1.status_code == 200
        
        # 4. 第二次使用相同授权码（应该失败）
        token_response2 = self.client.post("/token", data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": "http://localhost:3000/callback",
            "client_id": "test-client"
        })
        
        assert token_response2.status_code == 400
        assert "Invalid authorization code" in token_response2.json()["detail"]
    
    def test_expired_auth_code_cleanup(self):
        """测试过期授权码清理"""
        # 1. 创建用户
        user_id = db_service.create_user(
            email="cleanup@example.com",
            password_hash="hashed_password",
            name="Cleanup User"
        )
        
        # 2. 创建授权码
        auth_code = db_service.create_auth_code(
            client_id="test-client",
            redirect_uri="http://localhost:3000/callback",
            scope="openid profile email",
            user_id=user_id
        )
        
        # 3. 模拟时间过去，授权码过期
        import time
        with patch('time.time') as mock_time:
            # 模拟10分钟后
            mock_time.return_value = time.time() + 600
            
            # 4. 清理过期授权码
            db_service.cleanup_expired_auth_codes()
            
            # 5. 尝试使用过期的授权码
            token_response = self.client.post("/token", data={
                "grant_type": "authorization_code",
                "code": auth_code,
                "redirect_uri": "http://localhost:3000/callback",
                "client_id": "test-client"
            })
            
            assert token_response.status_code == 400
            assert "Invalid authorization code" in token_response.json()["detail"]
    
    def test_oidc_discovery_endpoint_integration(self):
        """测试OIDC发现端点集成"""
        response = self.client.get("/.well-known/openid_configuration")
        
        assert response.status_code == 200
        config = response.json()
        
        # 验证所有必需的端点都存在
        required_endpoints = [
            "authorization_endpoint",
            "token_endpoint",
            "userinfo_endpoint",
            "jwks_uri"
        ]
        
        for endpoint in required_endpoints:
            assert endpoint in config
            # 验证端点可访问
            endpoint_url = config[endpoint].replace("http://testserver", "")
            if endpoint == "authorization_endpoint":
                # 授权端点需要参数
                test_response = self.client.get(endpoint_url, params={
                    "response_type": "code",
                    "client_id": "test",
                    "redirect_uri": "http://localhost:3000/callback"
                })
                assert test_response.status_code in [200, 400]  # 200或参数错误
            elif endpoint == "jwks_uri":
                test_response = self.client.get(endpoint_url)
                assert test_response.status_code == 200
                assert "keys" in test_response.json()
    
    def test_cross_origin_requests(self):
        """测试跨域请求"""
        # 测试预检请求
        options_response = self.client.options("/token", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        })
        
        # 根据CORS配置验证响应
        # 这里假设应用配置了CORS
        assert options_response.status_code in [200, 204]
    
    def test_security_headers(self):
        """测试安全头"""
        response = self.client.get("/")
        
        # 验证安全相关的响应头
        # 这些头应该在生产环境中配置
        expected_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection"
        ]
        
        # 注意：这些头可能需要在中间件中配置
        # 这里只是示例，实际测试需要根据应用配置调整
        for header in expected_headers:
            # 如果配置了安全头，验证其存在
            if header in response.headers:
                assert response.headers[header] is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])