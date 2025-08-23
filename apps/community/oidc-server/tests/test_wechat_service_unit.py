import pytest
import os
from unittest.mock import patch, Mock, MagicMock, AsyncMock
from wechat_service import WechatService
from database import DatabaseService
from models import User, UserType
from datetime import datetime

@pytest.mark.skip(reason="微信公众平台未开通，暂时跳过微信服务测试")
@pytest.mark.unit
@pytest.mark.wechat
class TestWechatService:
    """微信服务单元测试"""
    
    def setup_method(self):
        """每个测试方法前的设置"""
        # 创建模拟的数据库服务
        self.mock_db_service = Mock()
        
        # 模拟环境变量
        with patch.dict('os.environ', {
            'WECHAT_APPID': 'test_app_id',
            'WECHAT_APPSECRET': 'test_app_secret'
        }):
            self.wechat_service = WechatService(self.mock_db_service)
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_get_access_token_success(self, mock_client_class):
        # 模拟httpx客户端和响应
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response = Mock()
        mock_response.json.return_value = {
            "access_token": "test_token",
            "expires_in": 7200,
            "refresh_token": "test_refresh_token",
            "openid": "test_openid",
            "scope": "snsapi_userinfo"
        }
        mock_client.get.return_value = mock_response
        
        result = await self.wechat_service.get_access_token("test_code")
        
        assert result["access_token"] == "test_token"
        assert result["openid"] == "test_openid"
    
    @pytest.mark.asyncio
    @patch('wechat_service.httpx.AsyncClient')
    async def test_get_access_token_invalid_code(self, mock_client_class):
        """测试获取访问令牌 - 无效授权码"""
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response = Mock()
        mock_response.json.return_value = {
            "errcode": 40029,
            "errmsg": "invalid code"
        }
        mock_client.get.return_value = mock_response
        
        with pytest.raises(Exception, match="获取access_token失败"):
            await self.wechat_service.get_access_token("invalid_code")
    
    @pytest.mark.asyncio
    @patch('wechat_service.httpx.AsyncClient')
    async def test_get_access_token_network_error(self, mock_client_class):
        """测试获取访问令牌 - 网络错误"""
        mock_client = Mock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get.side_effect = Exception("Network error")
        
        with pytest.raises(Exception, match="Network error"):
            await self.wechat_service.get_access_token("test_code")
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_get_user_info_success(self, mock_client_class):
        # 模拟httpx客户端和响应
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response = Mock()
        mock_response.json.return_value = {
            "openid": "test_openid",
            "nickname": "测试用户",
            "headimgurl": "http://example.com/avatar.jpg"
        }
        mock_client.get.return_value = mock_response
        
        result = await self.wechat_service.get_user_info("test_token", "test_openid")
        
        assert result["openid"] == "test_openid"
        assert result["nickname"] == "测试用户"
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_get_user_info_invalid_token(self, mock_client_class):
        """测试获取用户信息 - 无效访问令牌"""
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response = Mock()
        mock_response.json.return_value = {
            "errcode": 40001,
            "errmsg": "invalid access_token"
        }
        mock_client.get.return_value = mock_response
        
        with pytest.raises(Exception, match="获取用户信息失败"):
            await self.wechat_service.get_user_info("invalid_token", "test_openid")
    
    @pytest.mark.asyncio
    @patch('wechat_service.WechatService.get_access_token')
    async def test_exchange_code_for_user_existing_user(self, mock_get_access_token):
        """测试微信授权码换取用户 - 用户已存在"""
        # 模拟已存在的用户
        existing_user = User(
            sub="existing_user",
            name="现有用户",
            password="test_password123",
            user_type=UserType.PROGRAMMER,
            email="test@example.com",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.mock_db_service.get_user_by_wechat_openid.return_value = existing_user
        
        # 模拟get_access_token返回
        mock_get_access_token.return_value = {
            "access_token": "test_token",
            "openid": "test_openid"
        }
        
        result = await self.wechat_service.exchange_code_for_user("test_code", "programmer")
        
        assert result == existing_user
        self.mock_db_service.get_user_by_wechat_openid.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('wechat_service.WechatService.get_user_info')
    @patch('wechat_service.WechatService.get_access_token')
    async def test_exchange_code_for_user_new_user(self, mock_get_access_token, mock_get_user_info):
        """测试微信授权码换取用户 - 创建新用户"""
        # 模拟用户不存在
        self.mock_db_service.get_user_by_wechat_openid.return_value = None
        
        # 模拟get_access_token返回
        mock_get_access_token.return_value = {
            "access_token": "test_token",
            "openid": "test_openid"
        }
        
        # 模拟get_user_info返回
        mock_get_user_info.return_value = {
            "nickname": "新用户",
            "headimgurl": "http://example.com/avatar.jpg"
        }
        
        # 模拟新创建的用户
        new_user = User(
            sub="new_user",
            name="新用户",
            password="test_password123",
            user_type=UserType.PROGRAMMER,
            email="wechat_test_openid@example.com",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.mock_db_service.create_wechat_user.return_value = new_user
        
        result = await self.wechat_service.exchange_code_for_user("test_code", "programmer")
        
        assert result == new_user
        self.mock_db_service.create_wechat_user.assert_called_once()
    
    def test_wechat_disabled_no_config(self):
        """测试微信功能未配置时的行为"""
        # 创建没有配置的服务
        with patch.dict('os.environ', {}, clear=True):
            service = WechatService(self.mock_db_service)
            assert not service.wechat_enabled
    
    @pytest.mark.asyncio
    async def test_get_access_token_wechat_disabled(self):
        """测试微信功能未启用时获取访问令牌"""
        # 创建没有配置的服务
        with patch.dict('os.environ', {}, clear=True):
            service = WechatService(self.mock_db_service)
            
            with pytest.raises(Exception, match="微信功能未启用"):
                await service.get_access_token("test_code")
    
    @pytest.mark.asyncio
    async def test_get_user_info_wechat_disabled(self):
        """测试微信功能未启用时获取用户信息"""
        # 创建没有配置的服务
        with patch.dict('os.environ', {}, clear=True):
            service = WechatService(self.mock_db_service)
            
            with pytest.raises(Exception, match="微信功能未启用"):
                await service.get_user_info("test_token", "test_openid")