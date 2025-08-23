#!/usr/bin/env python3
"""
调试微信回调端点的404错误
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from models import User, UserType
from main import app

client = TestClient(app)

def test_wechat_callback_debug():
    """调试微信回调端点"""
    print("=== 调试微信回调端点 ===")
    
    # 模拟微信服务和数据库服务
    with patch('main.wechat_service') as mock_wechat, \
         patch('main.db_service') as mock_db:
        
        # 模拟微信服务返回用户
        callback_user = User(
            id="callback_user_123",
            sub="callback_user_123",
            name="回调用户",
            password="$2b$12$hashed_password_callback_with_bcrypt_format",
            user_type=UserType.PROGRAMMER,
            email="callback@example.com",
            avatar="http://example.com/callback_avatar.jpg",
            is_active=True
        )
        mock_wechat.exchange_code_for_user = AsyncMock(return_value=callback_user)
        
        # 模拟授权码数据
        mock_db.get_auth_code.return_value = {
            "client_id": "test-client",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile"
        }
        
        print("1. 发送微信回调请求...")
        response = client.get("/wechat/callback", params={
            "code": "valid_callback_code",
            "state": "auth_code_123|original_state"
        })
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code != 307:
            print(f"响应内容: {response.text}")
            try:
                print(f"响应JSON: {response.json()}")
            except:
                pass
        
        # 检查mock调用
        print(f"\n2. 检查mock调用...")
        print(f"get_auth_code调用次数: {mock_db.get_auth_code.call_count}")
        if mock_db.get_auth_code.call_count > 0:
            print(f"get_auth_code调用参数: {mock_db.get_auth_code.call_args}")
        
        print(f"exchange_code_for_user调用次数: {mock_wechat.exchange_code_for_user.call_count}")
        if mock_wechat.exchange_code_for_user.call_count > 0:
            print(f"exchange_code_for_user调用参数: {mock_wechat.exchange_code_for_user.call_args}")
        
        print(f"save_auth_code调用次数: {mock_db.save_auth_code.call_count}")
        if mock_db.save_auth_code.call_count > 0:
            print(f"save_auth_code调用参数: {mock_db.save_auth_code.call_args}")

def test_wechat_callback_without_mocks():
    """测试不使用mock的微信回调"""
    print("\n=== 测试不使用mock的微信回调 ===")
    
    response = client.get("/wechat/callback", params={
        "code": "test_code",
        "state": "test_auth|test_state"
    })
    
    print(f"响应状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    try:
        print(f"响应JSON: {response.json()}")
    except:
        pass

if __name__ == "__main__":
    test_wechat_callback_debug()
    test_wechat_callback_without_mocks()