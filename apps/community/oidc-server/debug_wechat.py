#!/usr/bin/env python3

import sys
sys.path.append('.')

from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from main import app
from models import User, UserType
from datetime import datetime, timezone

client = TestClient(app)

# 创建mock用户
existing_user = User(
    id="user123",
    sub="user123",
    email="wechat_user@example.com",
    name="微信用户",
    password="$2b$12$hashed_password_wechat",
    user_type=UserType.PROGRAMMER,
    avatar="http://example.com/avatar.jpg",
    is_active=True,
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)

with patch('main.wechat_service') as mock_wechat, \
     patch('main.db_service') as mock_db:
    
    # 设置模拟数据
    mock_wechat.wechat_enabled = True
    # 使用AsyncMock来模拟异步方法
    from unittest.mock import AsyncMock
    mock_wechat.exchange_code_for_user = AsyncMock(return_value=existing_user)
    
    # 模拟授权码验证
    mock_db.get_auth_code.return_value = {
        "client_id": "test-client",
        "redirect_uri": "http://localhost:3000/callback",
        "scope": "openid profile",
        "user_sub": None
    }
    
    # 微信回调
    response = client.get("/wechat/callback", params={
        "code": "wechat_auth_code",
        "state": "test_auth_code_123|test_state"
    })
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Headers: {response.headers}")