import pytest
import json
import time
import re
from datetime import datetime, timezone
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from main import app, db_service
from models import User, UserType, WechatLoginRequest
from wechat_service import WechatService
from database import DatabaseService

client = TestClient(app)

@pytest.mark.skip(reason="微信公众平台未开通，暂时跳过微信登录功能")
@pytest.mark.unit
@pytest.mark.wechat
class TestWechatLogin:
    """微信登录功能单元测试"""
    
    def setup_method(self):
        """每个测试方法执行前的设置"""
        # 测试前的设置
        pass
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    @patch.dict('os.environ', {'WECHAT_APPID': 'test_app_id'})
    def test_wechat_login_redirect(self, mock_db, mock_wechat):
        """测试微信登录重定向"""
        # 模拟微信服务已启用
        mock_wechat.wechat_enabled = True
        mock_db.get_application_by_client_id.return_value = {
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        
        # 获取授权码并触发微信登录
        auth_response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid",
            "login_type": "wechat"  # 触发微信登录
        }, follow_redirects=False)
        
        # 应该重定向到微信授权页面
        assert auth_response.status_code == 307
        assert "open.weixin.qq.com" in auth_response.headers["location"]
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    def test_wechat_login_disabled(self, mock_db, mock_wechat):
        """测试微信登录禁用时的行为"""
        mock_wechat.wechat_enabled = False
        mock_db.get_application_by_client_id.return_value = {
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback"
        }
        mock_db.save_auth_code.return_value = None
        
        response = client.get("/authorize", params={
            "response_type": "code",
            "client_id": "test_client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "state": "test_state",
            "login_type": "wechat"
        })
        
        assert response.status_code == 200
        assert "PhoenixCoder OIDC Login" in response.text
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    def test_wechat_callback_success_existing_user(self, mock_db, mock_wechat):
        """测试微信回调成功 - 已存在用户"""
        # 模拟微信服务返回用户对象
        mock_wechat.exchange_code_for_user = AsyncMock(return_value=User(
            sub="wechat_123",
            name="Test User",
            email="test@example.com",
            password="hashed_password123",
            user_type="programmer"
        ))
        
        # 模拟数据库返回授权码信息
        # 当调用 get_auth_code('auth_code') 时返回授权码数据
        def mock_get_auth_code(auth_code):
            if auth_code == "auth_code":
                return {
                    "client_id": "test_client",
                    "redirect_uri": "http://localhost:3000/callback",
                    "state": "test_state",
                    "scope": "openid profile",
                    "user_sub": "wechat_123"
                }
            return None
        
        mock_db.get_auth_code.side_effect = mock_get_auth_code
        
        # 模拟 save_auth_code 方法
        mock_db.save_auth_code.return_value = None
        
        response = client.get("/wechat/callback", params={
            "code": "test_code",
            "state": "auth_code|test_state"
        }, follow_redirects=False)
        
        assert response.status_code == 307  # FastAPI 使用 307 进行重定向
        assert "http://localhost:3000/callback" in response.headers["location"]
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    def test_wechat_callback_success_new_user(self, mock_db, mock_wechat):
        """测试微信回调成功 - 新用户"""
        # 模拟微信服务返回新用户对象
        mock_wechat.exchange_code_for_user = AsyncMock(return_value=User(
            sub="new_user",
            name="新用户",
            email="new@example.com",
            password="$2b$12$hashed_password123",
            user_type="programmer"
        ))
        
        # 模拟数据库返回授权码信息
        def mock_get_auth_code(auth_code):
            if auth_code == "auth_code":
                return {
                    "client_id": "test_client",
                    "redirect_uri": "http://localhost:3000/callback",
                    "state": "test_state",
                    "scope": "openid profile"
                }
            return None
        
        mock_db.get_auth_code.side_effect = mock_get_auth_code
        mock_db.save_auth_code.return_value = None
        
        response = client.get("/wechat/callback", params={
            "code": "test_code",
            "state": "auth_code|test_state"
        }, follow_redirects=False)
        
        assert response.status_code == 307  # FastAPI 使用 307 进行重定向
        assert "http://localhost:3000/callback" in response.headers["location"]
    
    @patch('main.db_service')
    def test_wechat_callback_invalid_state(self, mock_db):
        """测试微信回调无效state"""
        # 模拟数据库找不到授权码
        mock_db.get_auth_code.return_value = None
        
        response = client.get("/wechat/callback", params={
            "code": "test_code",
            "state": "invalid_state"
        })
        
        assert response.status_code == 400  # 实际返回 400 而不是 500
        assert "Invalid state" in response.text
    
    def test_wechat_callback_missing_code(self):
        """测试缺少code参数"""
        response = client.get("/wechat/callback", params={
            "state": "auth_code|test_state"
        })
        
        assert response.status_code == 422  # FastAPI validation error
    
    def test_wechat_callback_missing_state(self):
        """测试缺少state参数"""
        response = client.get("/wechat/callback", params={
            "code": "test_code"
        })
        
        assert response.status_code == 422  # FastAPI validation error
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    def test_wechat_callback_service_error(self, mock_db, mock_wechat):
        """测试微信服务错误"""
        # 模拟数据库返回授权码信息
        def mock_get_auth_code(auth_code):
            if auth_code == "auth_code":
                return {
                    "client_id": "test_client",
                    "redirect_uri": "http://localhost:3000/callback",
                    "state": "test_state"
                }
            return None
        
        mock_db.get_auth_code.side_effect = mock_get_auth_code
        mock_wechat.exchange_code_for_user = AsyncMock(side_effect=Exception("WeChat service error"))
        
        response = client.get("/wechat/callback", params={
            "code": "test_code",
            "state": "auth_code|test_state"
        })
        # 验证响应
        assert response.status_code == 400
        assert "微信登录失败" in response.json()["detail"]
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    def test_wechat_callback_expired_auth_code(self, mock_db, mock_wechat):
        """测试过期的授权码"""
        mock_wechat.wechat_enabled = True
        mock_db.get_auth_code.return_value = None  # 模拟授权码不存在
        
        callback_response = client.get("/wechat/callback", params={
            "code": "wechat_auth_code",
            "state": "expired_auth_code_123|test_state"
        })
        
        assert callback_response.status_code == 400
        assert "Invalid auth code" in callback_response.json()["detail"]
    
    @patch('main.wechat_service')
    @patch('main.db_service')
    def test_wechat_callback_database_error(self, mock_db, mock_wechat):
        """测试数据库错误"""
        mock_db.get_auth_code.side_effect = Exception("Database error")
        
        response = client.get("/wechat/callback", params={
            "code": "test_code",
            "state": "auth_code|test_state"
        })
        # 验证响应
        assert response.status_code == 500
        assert "Database error" in response.json()["detail"]

@pytest.mark.unit
@pytest.mark.auth
class TestWechatService:
    """微信服务单元测试"""
    
    @patch('wechat_service.httpx.AsyncClient')
    @patch.dict('os.environ', {'WECHAT_APPID': 'test_app_id', 'WECHAT_APPSECRET': 'test_secret'})
    @pytest.mark.asyncio
    async def test_get_user_info_success(self, mock_client):
        """测试获取用户信息成功"""
        from unittest.mock import AsyncMock
        
        # 模拟httpx响应
        mock_response = Mock()
        mock_response.json.return_value = {
            "openid": "test_openid",
            "nickname": "测试用户",
            "headimgurl": "http://example.com/avatar.jpg"
        }
        
        # 正确配置AsyncMock
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_context)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_context.get = AsyncMock(return_value=mock_response)
        mock_client.return_value = mock_context
        
        # 创建模拟的db_service
        mock_db = Mock()
        service = WechatService(mock_db)
        result = await service.get_user_info("test_access_token", "test_openid")
        
        assert result["openid"] == "test_openid"
        assert result["nickname"] == "测试用户"
        assert result["headimgurl"] == "http://example.com/avatar.jpg"
    
    @patch('wechat_service.httpx.AsyncClient')
    @patch.dict('os.environ', {
        'WECHAT_APPID': 'invalid_app_id',
        'WECHAT_APPSECRET': 'test_app_secret',
        'WECHAT_REDIRECT_URI': 'http://localhost:8001/wechat/callback'
    })
    def test_get_access_token_error(self, mock_client):
        """测试获取access_token失败"""
        # 模拟httpx客户端
        from unittest.mock import AsyncMock
        mock_context = AsyncMock()
        mock_client.return_value.__aenter__.return_value = mock_context
        
        # 模拟微信API错误响应
        mock_response = Mock()
        mock_response.json.return_value = {
            "errcode": 40013,
            "errmsg": "invalid appid"
        }
        
        mock_context.get.return_value = mock_response
        
        mock_db = Mock()
        wechat_service = WechatService(mock_db)
        
        with pytest.raises(Exception) as exc_info:
            import asyncio
            asyncio.run(wechat_service.get_access_token("wechat_auth_code"))
        
        assert "获取access_token失败" in str(exc_info.value)
    
    @patch('wechat_service.httpx.AsyncClient')
    @patch.dict('os.environ', {
        'WECHAT_APPID': 'test_app_id',
        'WECHAT_APPSECRET': 'test_app_secret',
        'WECHAT_REDIRECT_URI': 'http://localhost:8001/wechat/callback'
    })
    def test_get_user_info_userinfo_error(self, mock_client):
        """测试获取用户信息失败"""
        # 模拟httpx客户端
        from unittest.mock import AsyncMock
        mock_context = AsyncMock()
        mock_client.return_value.__aenter__.return_value = mock_context
        
        # 模拟获取用户信息失败
        mock_userinfo_response = Mock()
        mock_userinfo_response.json.return_value = {
            "errcode": 40001,
            "errmsg": "invalid access_token"
        }
        
        mock_context.get.return_value = mock_userinfo_response
        
        mock_db = Mock()
        wechat_service = WechatService(mock_db)
        
        with pytest.raises(Exception) as exc_info:
            import asyncio
            asyncio.run(wechat_service.get_user_info("invalid_access_token", "wechat_openid_123"))
        
        assert "获取用户信息失败" in str(exc_info.value)
    
    @patch.dict('os.environ', {}, clear=True)
    def test_wechat_service_disabled(self):
        """测试微信服务未启用"""
        mock_db = Mock()
        wechat_service = WechatService(mock_db)
        assert not wechat_service.wechat_enabled
        
        with pytest.raises(Exception) as exc_info:
            import asyncio
            asyncio.run(wechat_service.get_access_token("wechat_auth_code"))
        
        assert "微信功能未启用" in str(exc_info.value)