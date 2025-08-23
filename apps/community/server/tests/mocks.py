"""测试Mock配置

提供各种外部服务和API的模拟实现，支持不同测试场景的需求。
"""

import json
import asyncio
from typing import Dict, List, Optional, Any, Callable
from unittest.mock import Mock, AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
import pytest
import httpx
import redis
from sqlalchemy.ext.asyncio import AsyncSession
from faker import Faker
import uuid

fake = Faker('zh_CN')

# ============================================================================
# 数据库Mock
# ============================================================================

class MockAsyncSession:
    """模拟异步数据库会话"""
    
    def __init__(self):
        self.data_store = {}
        self.committed = False
        self.rolled_back = False
        self.closed = False
    
    async def execute(self, query, params=None):
        """模拟执行SQL查询"""
        result = MockResult()
        return result
    
    async def commit(self):
        """模拟提交事务"""
        self.committed = True
    
    async def rollback(self):
        """模拟回滚事务"""
        self.rolled_back = True
    
    async def close(self):
        """模拟关闭会话"""
        self.closed = True
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        else:
            await self.commit()
        await self.close()

class MockResult:
    """模拟查询结果"""
    
    def __init__(self, data=None):
        self.data = data or []
        self.rowcount = len(self.data) if isinstance(self.data, list) else 1
    
    def fetchone(self):
        """获取单行结果"""
        return self.data[0] if self.data else None
    
    def fetchall(self):
        """获取所有结果"""
        return self.data
    
    def scalar(self):
        """获取标量值"""
        if self.data and isinstance(self.data[0], (dict, tuple)):
            return list(self.data[0].values())[0] if isinstance(self.data[0], dict) else self.data[0][0]
        return self.data[0] if self.data else None

# ============================================================================
# Redis Mock
# ============================================================================

class MockRedis:
    """模拟Redis客户端"""
    
    def __init__(self):
        self.data = {}
        self.expires = {}
        self.connected = True
    
    async def get(self, key: str) -> Optional[str]:
        """获取值"""
        if key in self.expires and datetime.now() > self.expires[key]:
            del self.data[key]
            del self.expires[key]
            return None
        return self.data.get(key)
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """设置值"""
        self.data[key] = value
        if ex:
            self.expires[key] = datetime.now() + timedelta(seconds=ex)
        return True
    
    async def delete(self, key: str) -> int:
        """删除键"""
        if key in self.data:
            del self.data[key]
            if key in self.expires:
                del self.expires[key]
            return 1
        return 0
    
    async def exists(self, key: str) -> int:
        """检查键是否存在"""
        return 1 if key in self.data else 0
    
    async def expire(self, key: str, seconds: int) -> bool:
        """设置过期时间"""
        if key in self.data:
            self.expires[key] = datetime.now() + timedelta(seconds=seconds)
            return True
        return False
    
    async def ttl(self, key: str) -> int:
        """获取剩余生存时间"""
        if key not in self.data:
            return -2
        if key not in self.expires:
            return -1
        remaining = (self.expires[key] - datetime.now()).total_seconds()
        return int(remaining) if remaining > 0 else -2
    
    async def flushdb(self) -> bool:
        """清空数据库"""
        self.data.clear()
        self.expires.clear()
        return True
    
    async def ping(self) -> bool:
        """检查连接"""
        return self.connected
    
    async def close(self):
        """关闭连接"""
        self.connected = False

# ============================================================================
# HTTP客户端Mock
# ============================================================================

class MockHttpResponse:
    """模拟HTTP响应"""
    
    def __init__(self, status_code: int = 200, json_data: Dict = None, text: str = ""):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text
        self.headers = {"content-type": "application/json"}
    
    def json(self):
        """返回JSON数据"""
        return self._json_data
    
    def raise_for_status(self):
        """检查状态码"""
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"HTTP {self.status_code}",
                request=None,
                response=self
            )

class MockHttpClient:
    """模拟HTTP客户端"""
    
    def __init__(self):
        self.responses = {}
        self.request_history = []
    
    def add_response(self, method: str, url: str, response: MockHttpResponse):
        """添加模拟响应"""
        key = f"{method.upper()}:{url}"
        self.responses[key] = response
    
    async def request(self, method: str, url: str, **kwargs) -> MockHttpResponse:
        """发送请求"""
        self.request_history.append({
            'method': method,
            'url': url,
            'kwargs': kwargs,
            'timestamp': datetime.now()
        })
        
        key = f"{method.upper()}:{url}"
        if key in self.responses:
            return self.responses[key]
        
        # 默认响应
        return MockHttpResponse(status_code=404, json_data={"error": "Not found"})
    
    async def get(self, url: str, **kwargs) -> MockHttpResponse:
        return await self.request("GET", url, **kwargs)
    
    async def post(self, url: str, **kwargs) -> MockHttpResponse:
        return await self.request("POST", url, **kwargs)
    
    async def put(self, url: str, **kwargs) -> MockHttpResponse:
        return await self.request("PUT", url, **kwargs)
    
    async def delete(self, url: str, **kwargs) -> MockHttpResponse:
        return await self.request("DELETE", url, **kwargs)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

# ============================================================================
# 外部服务Mock
# ============================================================================

class MockEmailService:
    """模拟邮件服务"""
    
    def __init__(self):
        self.sent_emails = []
        self.should_fail = False
    
    async def send_email(self, to: str, subject: str, body: str, **kwargs) -> bool:
        """发送邮件"""
        if self.should_fail:
            raise Exception("邮件发送失败")
        
        self.sent_emails.append({
            'to': to,
            'subject': subject,
            'body': body,
            'timestamp': datetime.now(),
            **kwargs
        })
        return True
    
    def get_sent_emails(self) -> List[Dict]:
        """获取已发送邮件"""
        return self.sent_emails.copy()
    
    def clear_sent_emails(self):
        """清空已发送邮件"""
        self.sent_emails.clear()

class MockSMSService:
    """模拟短信服务"""
    
    def __init__(self):
        self.sent_messages = []
        self.should_fail = False
    
    async def send_sms(self, phone: str, message: str, **kwargs) -> bool:
        """发送短信"""
        if self.should_fail:
            raise Exception("短信发送失败")
        
        self.sent_messages.append({
            'phone': phone,
            'message': message,
            'timestamp': datetime.now(),
            **kwargs
        })
        return True
    
    def get_sent_messages(self) -> List[Dict]:
        """获取已发送短信"""
        return self.sent_messages.copy()

class MockPaymentService:
    """模拟支付服务"""
    
    def __init__(self):
        self.transactions = []
        self.should_fail = False
        self.balance = 10000.0  # 模拟账户余额
    
    async def create_payment(self, amount: float, currency: str = "CNY", **kwargs) -> Dict:
        """创建支付"""
        if self.should_fail:
            raise Exception("支付创建失败")
        
        transaction_id = str(uuid.uuid4())
        transaction = {
            'id': transaction_id,
            'amount': amount,
            'currency': currency,
            'status': 'pending',
            'created_at': datetime.now(),
            **kwargs
        }
        
        self.transactions.append(transaction)
        return transaction
    
    async def confirm_payment(self, transaction_id: str) -> bool:
        """确认支付"""
        for transaction in self.transactions:
            if transaction['id'] == transaction_id:
                if self.balance >= transaction['amount']:
                    transaction['status'] = 'completed'
                    self.balance -= transaction['amount']
                    return True
                else:
                    transaction['status'] = 'failed'
                    return False
        return False
    
    async def refund_payment(self, transaction_id: str) -> bool:
        """退款"""
        for transaction in self.transactions:
            if transaction['id'] == transaction_id and transaction['status'] == 'completed':
                transaction['status'] = 'refunded'
                self.balance += transaction['amount']
                return True
        return False
    
    def get_balance(self) -> float:
        """获取余额"""
        return self.balance

class MockFileStorage:
    """模拟文件存储服务"""
    
    def __init__(self):
        self.files = {}
        self.should_fail = False
    
    async def upload_file(self, file_path: str, content: bytes, **kwargs) -> str:
        """上传文件"""
        if self.should_fail:
            raise Exception("文件上传失败")
        
        file_id = str(uuid.uuid4())
        self.files[file_id] = {
            'path': file_path,
            'content': content,
            'size': len(content),
            'uploaded_at': datetime.now(),
            **kwargs
        }
        
        return f"https://storage.example.com/{file_id}"
    
    async def download_file(self, file_url: str) -> bytes:
        """下载文件"""
        file_id = file_url.split('/')[-1]
        if file_id in self.files:
            return self.files[file_id]['content']
        raise FileNotFoundError("文件不存在")
    
    async def delete_file(self, file_url: str) -> bool:
        """删除文件"""
        file_id = file_url.split('/')[-1]
        if file_id in self.files:
            del self.files[file_id]
            return True
        return False

# ============================================================================
# 认证和授权Mock
# ============================================================================

class MockAuthService:
    """模拟认证服务"""
    
    def __init__(self):
        self.users = {}
        self.tokens = {}
        self.should_fail = False
    
    async def authenticate(self, username: str, password: str) -> Optional[Dict]:
        """用户认证"""
        if self.should_fail:
            return None
        
        user_key = f"{username}:{password}"
        if user_key in self.users:
            return self.users[user_key]
        
        # 创建默认用户
        user = {
            'id': str(uuid.uuid4()),
            'username': username,
            'email': f"{username}@example.com",
            'role': 'user',
            'is_active': True
        }
        self.users[user_key] = user
        return user
    
    async def generate_token(self, user_id: str) -> str:
        """生成访问令牌"""
        token = f"token_{uuid.uuid4()}"
        self.tokens[token] = {
            'user_id': user_id,
            'expires_at': datetime.now() + timedelta(hours=24)
        }
        return token
    
    async def verify_token(self, token: str) -> Optional[Dict]:
        """验证令牌"""
        if token in self.tokens:
            token_data = self.tokens[token]
            if datetime.now() < token_data['expires_at']:
                return token_data
            else:
                del self.tokens[token]
        return None
    
    async def revoke_token(self, token: str) -> bool:
        """撤销令牌"""
        if token in self.tokens:
            del self.tokens[token]
            return True
        return False

# ============================================================================
# Mock工厂和装饰器
# ============================================================================

class MockFactory:
    """Mock工厂类"""
    
    @staticmethod
    def create_database_session() -> MockAsyncSession:
        """创建数据库会话Mock"""
        return MockAsyncSession()
    
    @staticmethod
    def create_redis_client() -> MockRedis:
        """创建Redis客户端Mock"""
        return MockRedis()
    
    @staticmethod
    def create_http_client() -> MockHttpClient:
        """创建HTTP客户端Mock"""
        return MockHttpClient()
    
    @staticmethod
    def create_email_service() -> MockEmailService:
        """创建邮件服务Mock"""
        return MockEmailService()
    
    @staticmethod
    def create_sms_service() -> MockSMSService:
        """创建短信服务Mock"""
        return MockSMSService()
    
    @staticmethod
    def create_payment_service() -> MockPaymentService:
        """创建支付服务Mock"""
        return MockPaymentService()
    
    @staticmethod
    def create_file_storage() -> MockFileStorage:
        """创建文件存储Mock"""
        return MockFileStorage()
    
    @staticmethod
    def create_auth_service() -> MockAuthService:
        """创建认证服务Mock"""
        return MockAuthService()

# 装饰器函数
def mock_database(func):
    """数据库Mock装饰器"""
    async def wrapper(*args, **kwargs):
        with patch('sqlalchemy.ext.asyncio.AsyncSession', MockAsyncSession):
            return await func(*args, **kwargs)
    return wrapper

def mock_redis(func):
    """Redis Mock装饰器"""
    async def wrapper(*args, **kwargs):
        with patch('redis.Redis', MockRedis):
            return await func(*args, **kwargs)
    return wrapper

def mock_http_client(func):
    """HTTP客户端Mock装饰器"""
    async def wrapper(*args, **kwargs):
        with patch('httpx.AsyncClient', MockHttpClient):
            return await func(*args, **kwargs)
    return wrapper

def mock_external_services(func):
    """外部服务Mock装饰器"""
    async def wrapper(*args, **kwargs):
        mocks = {
            'email_service': MockFactory.create_email_service(),
            'sms_service': MockFactory.create_sms_service(),
            'payment_service': MockFactory.create_payment_service(),
            'file_storage': MockFactory.create_file_storage(),
            'auth_service': MockFactory.create_auth_service()
        }
        
        # 将mock对象注入到kwargs中
        kwargs.update(mocks)
        return await func(*args, **kwargs)
    return wrapper

# ============================================================================
# Pytest Fixtures
# ============================================================================

@pytest.fixture
async def mock_db_session():
    """数据库会话fixture"""
    session = MockFactory.create_database_session()
    yield session
    await session.close()

@pytest.fixture
async def mock_redis_client():
    """Redis客户端fixture"""
    client = MockFactory.create_redis_client()
    yield client
    await client.flushdb()
    await client.close()

@pytest.fixture
async def mock_http_client():
    """HTTP客户端fixture"""
    client = MockFactory.create_http_client()
    yield client

@pytest.fixture
def mock_email_service():
    """邮件服务fixture"""
    service = MockFactory.create_email_service()
    yield service
    service.clear_sent_emails()

@pytest.fixture
def mock_sms_service():
    """短信服务fixture"""
    service = MockFactory.create_sms_service()
    yield service

@pytest.fixture
def mock_payment_service():
    """支付服务fixture"""
    service = MockFactory.create_payment_service()
    yield service

@pytest.fixture
def mock_file_storage():
    """文件存储fixture"""
    storage = MockFactory.create_file_storage()
    yield storage

@pytest.fixture
def mock_auth_service():
    """认证服务fixture"""
    service = MockFactory.create_auth_service()
    yield service

@pytest.fixture
def mock_all_services():
    """所有服务Mock的组合fixture"""
    return {
        'db_session': MockFactory.create_database_session(),
        'redis_client': MockFactory.create_redis_client(),
        'http_client': MockFactory.create_http_client(),
        'email_service': MockFactory.create_email_service(),
        'sms_service': MockFactory.create_sms_service(),
        'payment_service': MockFactory.create_payment_service(),
        'file_storage': MockFactory.create_file_storage(),
        'auth_service': MockFactory.create_auth_service()
    }

# 导出主要类和函数
__all__ = [
    'MockAsyncSession',
    'MockRedis',
    'MockHttpClient',
    'MockEmailService',
    'MockSMSService',
    'MockPaymentService',
    'MockFileStorage',
    'MockAuthService',
    'MockFactory',
    'mock_database',
    'mock_redis',
    'mock_http_client',
    'mock_external_services'
]