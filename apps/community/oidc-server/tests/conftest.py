import pytest
import os
import time
from unittest.mock import patch, MagicMock
from database import DatabaseService

@pytest.fixture(scope="session", autouse=True)
def setup_test_data():
    """设置测试数据"""
    try:
        # 初始化数据库服务
        db_service = DatabaseService()
        
        # 检查test-client是否已存在
        existing_app = db_service.get_application_by_client_id("test-client")
        if not existing_app:
            # 添加测试应用
            with db_service.pg_conn.cursor() as cursor:
                from datetime import datetime, timezone
                current_time = int(datetime.now(timezone.utc).timestamp())
                cursor.execute("""
                    INSERT INTO applications (client_id, client_secret, redirect_uri, name, description, app_type, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (client_id) DO NOTHING
                """, (
                    "test-client",
                    "test-secret", 
                    "http://localhost:3000/callback",
                    "Test Application",
                    "Test application for unit tests",
                    "web",
                    current_time,
                    current_time
                ))
                db_service.pg_conn.commit()
        
        # 检查valid-client是否已存在
        existing_valid_app = db_service.get_application_by_client_id("valid-client")
        if not existing_valid_app:
            # 添加另一个测试应用
            with db_service.pg_conn.cursor() as cursor:
                from datetime import datetime, timezone
                current_time = int(datetime.now(timezone.utc).timestamp())
                cursor.execute("""
                    INSERT INTO applications (client_id, client_secret, redirect_uri, name, description, app_type, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (client_id) DO NOTHING
                """, (
                    "valid-client",
                    "valid-secret", 
                    "http://localhost:3000/callback",
                    "Valid Test Application",
                    "Valid test application for unit tests",
                    "web",
                    current_time,
                    current_time
                ))
                db_service.pg_conn.commit()
        
        # 检查测试用户是否已存在
        existing_user = db_service.get_user_by_email("test@example.com")
        if not existing_user:
            # 添加测试用户
            from models import UserCreate, UserType
            user_create = UserCreate(
                email="test@example.com",
                password="password123",
                name="Test User",
                user_type=UserType.PROGRAMMER
            )
            test_user = db_service.create_user(user_create)
            print(f"创建测试用户: {test_user}")
            print(f"测试用户sub: {test_user.sub}")
        else:
            print(f"测试用户已存在: {existing_user}")
            print(f"现有测试用户sub: {existing_user.get('sub') if isinstance(existing_user, dict) else getattr(existing_user, 'sub', None)}")
        
        print("测试数据设置完成")
        
    except Exception as e:
        print(f"设置测试数据时出错: {e}")
        # 不抛出异常，让测试继续运行
        pass

@pytest.fixture
def mock_wechat_service():
    """模拟微信服务"""
    with patch('main.wechat_service') as mock:
        mock.wechat_enabled = False
        mock.get_access_token.return_value = "mock_access_token"
        mock.get_user_info.return_value = {
            "openid": "mock_openid",
            "nickname": "Mock User",
            "headimgurl": "http://example.com/avatar.jpg"
        }
        yield mock

@pytest.fixture
def mock_db_service():
    """模拟数据库服务"""
    with patch('main.db_service') as mock:
        # 设置默认返回值
        mock.get_application_by_client_id.return_value = {
            "client_id": "test-client",
            "client_secret": "test-secret",
            "redirect_uri": "http://localhost:3000/callback",
            "name": "Test Application"
        }
        mock.get_user_by_email.return_value = {
            "id": "test-user-id",
            "email": "test@example.com",
            "name": "Test User",
            "password_hash": "$2b$12$BRIh2b9IpC4Jv5Zt6uH7weW4BYcZp8RvXaySEi7a1TWrPj02bgwxa"
        }
        mock.verify_password.return_value = True
        mock.save_auth_code.return_value = None
        mock.get_auth_code.return_value = {
            "client_id": "test-client",
            "user_id": "test-user-id",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid",
            "state": "test_state_123"
        }
        yield mock