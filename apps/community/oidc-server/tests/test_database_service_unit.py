import pytest
import time
from unittest.mock import patch, MagicMock, Mock
from database import DatabaseService
from models import User, UserType, UserCreate, UserUpdate
from datetime import datetime, timezone

@pytest.mark.unit
@pytest.mark.database
class TestDatabaseService:
    """数据库服务单元测试"""
    
    def setup_method(self):
        """每个测试方法前的设置"""
        with patch('database.psycopg2.connect'), patch('database.redis.Redis'):
            self.db_service = DatabaseService()
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_create_user_success(self, mock_redis, mock_pg_connect):
        """测试创建用户成功"""
        # 模拟数据库连接
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        # 模拟检查用户不存在
        mock_cursor.fetchone.return_value = None
        
        user_create = UserCreate(
            name="测试用户",
            email="test@example.com",
            password="password123",
            user_type=UserType.PROGRAMMER
        )
        
        with patch.object(self.db_service, 'get_user_by_email', return_value=None), \
             patch.object(self.db_service, 'get_user_by_phone', return_value=None):
            result = self.db_service.create_user(user_create)
        
        assert result is not None
        assert result.name == "测试用户"
        assert result.email == "test@example.com"
        assert result.user_type == UserType.PROGRAMMER
        assert result.sub.startswith("user_")
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_create_user_duplicate_email(self, mock_redis, mock_pg_connect):
        """测试创建用户 - 邮箱重复"""
        existing_user = User(
            sub="existing_user",
            name="现有用户",
            email="existing@example.com",
            password="password123",
            user_type=UserType.PROGRAMMER,
            created_at=int(time.time()),
            updated_at=int(time.time())
        )
        
        user_create = UserCreate(
            name="测试用户",
            email="existing@example.com",
            password="password123",
            user_type=UserType.PROGRAMMER
        )
        
        with patch.object(self.db_service, 'get_user_by_email', return_value=existing_user):
            with pytest.raises(Exception, match="邮箱已被注册"):
                self.db_service.create_user(user_create)
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_get_user_by_email_success(self, mock_redis, mock_pg_connect):
        """测试通过邮箱获取用户成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        # 模拟数据库返回用户数据
        from datetime import timezone
        from models import UserType
        import uuid
        now = datetime.now(timezone.utc)
        timestamp = int(now.timestamp())
        mock_cursor.fetchone.return_value = {
            'id': str(uuid.uuid4()),
            'sub': 'user_123',
            'email': 'test@example.com',
            'phone': '13800138000',
            'name': '测试用户',
            'password': '$2b$12$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',  # 使用哈希密码格式
            'user_type': UserType.PROGRAMMER,
            'avatar': None,
            'is_active': True,
            'created_at': timestamp,
            'updated_at': timestamp,
            'last_login_at': timestamp,
            'login_count': 5
        }
        
        result = self.db_service.get_user_by_email("test@example.com")
        
        assert result is not None
        assert result.sub == "user_123"
        assert result.name == "测试用户"
        assert result.email == "test@example.com"
        assert result.user_type == UserType.PROGRAMMER
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_get_user_by_email_not_found(self, mock_redis, mock_pg_connect):
        """测试通过邮箱获取用户 - 用户不存在"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        mock_cursor.fetchone.return_value = None
        
        result = self.db_service.get_user_by_email("nonexistent@example.com")
        
        assert result is None
        mock_cursor.execute.assert_called_once()
    
    @pytest.mark.skip(reason="微信公众平台未开通，暂时跳过微信相关测试")
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_get_user_by_wechat_openid_success(self, mock_redis, mock_pg_connect):
        """测试通过微信OpenID获取用户成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        from datetime import timezone
        from models import UserType
        import uuid
        now = datetime.now(timezone.utc)
        timestamp = int(now.timestamp())
        mock_cursor.fetchone.return_value = {
            'id': str(uuid.uuid4()),
            'sub': 'user_123',
            'email': 'test@example.com',
            'phone': '13800138000',
            'name': '测试用户',
            'password': '$2b$12$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',  # 使用哈希密码格式
            'user_type': UserType.PROGRAMMER,
            'avatar': None,
            'is_active': True,
            'created_at': timestamp,
            'updated_at': timestamp,
            'last_login_at': timestamp,
            'login_count': 5
        }
        
        result = self.db_service.get_user_by_wechat_openid("wechat_openid_123")
        
        assert result is not None
        assert result.sub == "user_123"
        assert result.name == "测试用户"
        assert result.user_type == UserType.PROGRAMMER
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_create_wechat_user_success(self, mock_redis, mock_pg_connect):
        """测试创建微信用户成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        # 模拟用户不存在
        with patch.object(self.db_service, 'get_user_by_wechat_openid', return_value=None):
            result = self.db_service.create_wechat_user(
            openid="wechat_openid_123",
            nickname="微信用户",
            avatar="http://example.com/avatar.jpg",
            user_type=UserType.PROGRAMMER
        )
        
        assert result is not None
        assert result.name == "微信用户"
        assert result.avatar == "http://example.com/avatar.jpg"
        assert result.sub.startswith("user_")
        assert result.email.startswith("wechat_")
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_create_wechat_user_existing_user(self, mock_redis, mock_pg_connect):
        """测试创建微信用户 - 用户已存在"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        existing_user = User(
            id="user_existing",
            sub="existing_wechat_user",
            name="现有微信用户",
            email="wechat_existing@example.com",
            password="Test123!",
            user_type=UserType.PROGRAMMER,
            avatar="http://example.com/existing_avatar.jpg",
            is_active=True,
            created_at=now,
            updated_at=now,
            last_login_at=now,
            login_count=1
        )
        
        with patch.object(self.db_service, 'get_user_by_wechat_openid', return_value=existing_user):
            result = self.db_service.create_wechat_user(
                openid="existing_openid",
                nickname="微信用户",
                avatar="http://example.com/avatar.jpg",
                user_type=UserType.PROGRAMMER
            )
        
        assert result == existing_user
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_save_auth_code_success(self, mock_redis, mock_pg_connect):
        """测试保存授权码成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        self.db_service.save_auth_code(
            code="auth_code_123",
            client_id="test_client",
            user_sub="user_123",
            redirect_uri="http://localhost:3000/callback",
            scope="openid profile",
            state="test_state"
        )
        
        # 验证SQL执行
        assert mock_cursor.execute.called
        mock_conn.commit.assert_called_once()
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_get_auth_code_success(self, mock_redis, mock_pg_connect):
        """测试获取授权码成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        expires_at = int(time.time()) + 600
        mock_cursor.fetchone.return_value = {
            "code": "auth_code_123",
            "client_id": "test_client",
            "user_sub": "user_123",
            "redirect_uri": "http://localhost:3000/callback",
            "scope": "openid profile",
            "state": "test_state",
            "expires_at": expires_at,
            "created_at": int(time.time())
        }
        
        result = self.db_service.get_auth_code("auth_code_123")
        
        assert result is not None
        assert result["code"] == "auth_code_123"
        assert result["client_id"] == "test_client"
        assert result["user_sub"] == "user_123"
        assert result["scope"] == "openid profile"
        assert result["expires_at"] == expires_at
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_get_auth_code_expired(self, mock_redis, mock_pg_connect):
        """测试获取授权码 - 已过期"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        # 模拟过期的授权码
        expires_at = int(time.time()) - 600  # 已过期
        mock_cursor.fetchone.return_value = {
            "code": "expired_code",
            "expires_at": expires_at
        }
        
        result = self.db_service.get_auth_code("expired_code")
        
        assert result is None
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_delete_auth_code_success(self, mock_redis, mock_pg_connect):
        """测试删除授权码成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        self.db_service.delete_auth_code("auth_code_123")
        
        # 验证数据库操作
        assert mock_cursor.execute.called
        mock_conn.commit.assert_called_once()
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_get_application_by_client_id_success(self, mock_redis, mock_pg_connect):
        """测试通过client_id获取应用信息成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        now = datetime.now(timezone.utc)
        mock_cursor.fetchone.return_value = {
            "client_id": "test_client",
            "client_secret": "test_secret",
            "name": "测试应用",
            "redirect_uris": ["http://localhost:3000/callback"]
        }
        
        result = self.db_service.get_application_by_client_id("test_client")
        
        # 验证结果
        assert result is not None
        assert mock_cursor.execute.called
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_update_user_success(self, mock_redis, mock_pg_connect):
        """测试更新用户成功"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        existing_user = User(
            id="user_123",
            sub="user_123",
            name="原用户名",
            email="test@example.com",
            password="Test123!",
            user_type=UserType.PROGRAMMER,
            is_active=True,
            created_at=now,
            updated_at=now,
            last_login_at=now,
            login_count=1
        )
        
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        user_update = UserUpdate(name="更新后的用户名")
        
        with patch.object(self.db_service, 'get_user_by_sub', return_value=existing_user):
            result = self.db_service.update_user("user_123", user_update)
        
        assert result is not None
        assert result.name == "更新后的用户名"
        # 验证数据库操作
        assert mock_cursor.execute.called
        mock_conn.commit.assert_called_once()
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_update_user_not_found(self, mock_redis, mock_pg_connect):
        """测试更新用户 - 用户不存在"""
        user_update = UserUpdate(name="更新后的用户名")
        
        with patch.object(self.db_service, 'get_user_by_sub', return_value=None):
            result = self.db_service.update_user("nonexistent_user", user_update)
        
        assert result is None
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_delete_user_success(self, mock_redis, mock_pg_connect):
        """测试删除用户成功"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        # 设置rowcount为整数而不是Mock对象
        mock_cursor.rowcount = 1
        
        result = self.db_service.delete_user("user_123")
        
        assert result is True
        assert mock_cursor.execute.called
        mock_conn.commit.assert_called_once()
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_database_connection_error(self, mock_redis, mock_pg_connect):
        """测试数据库连接错误"""
        mock_pg_connect.side_effect = Exception("Database connection failed")
        
        with pytest.raises(Exception, match="Database connection failed"):
            DatabaseService()
    
    @patch('database.psycopg2.connect')
    @patch('database.redis.Redis')
    def test_transaction_rollback_on_error(self, mock_redis, mock_pg_connect):
        """测试事务回滚"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_pg_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        
        # 模拟执行过程中出错
        mock_cursor.execute.side_effect = Exception("数据库错误")
        
        # 测试事务回滚
        try:
            self.db_service.create_user(UserCreate(
                email="test@example.com",
                name="测试用户",
                password="password123",
                user_type=UserType.PROGRAMMER
            ))
            assert False, "应该抛出异常"
        except Exception:
            pass
        
        # 验证回滚被调用
        mock_conn.rollback.assert_called_once()