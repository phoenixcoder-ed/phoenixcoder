import os
import time
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
from models import User, UserCreate, UserUpdate, WechatLoginRequest
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import logging

# 获取日志记录器
logger = logging.getLogger(__name__)

# 加载项目根目录的.env.community配置文件
load_dotenv(dotenv_path="../../../.env.community")
# Load environment variables from .env file
load_dotenv()

# Also try to load from config.env if it exists
if os.path.exists('config.env'):
    load_dotenv('config.env', override=True)

class DatabaseService:
    def __init__(self):
        # 连接状态标志
        self.pg_connected = False
        self.redis_connected = False
        self.pg_conn = None
        self.redis_client = None
        
        # 初始化PostgreSQL连接
        self._init_postgres()
        
        # 初始化Redis客户端
        self._init_redis()
        
        # 确保表结构存在（仅在数据库连接成功时）
        if self.pg_connected:
            self._init_db()
    
    def _init_postgres(self):
        """初始化PostgreSQL连接"""
        try:
            self.pg_conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=os.getenv('POSTGRES_PORT', '5432'),
                dbname=os.getenv('POSTGRES_DB', 'phoenixcoder'),
                user=os.getenv('POSTGRES_USER', 'phoenixcoder'),
                password=os.getenv('POSTGRES_PASSWORD', 'password')
            )
            self.pg_connected = True
            logger.info("✅ PostgreSQL 连接成功")
        except Exception as e:
            self.pg_connected = False
            logger.warning(f"⚠️ PostgreSQL 连接失败，服务将在无数据库模式下启动: {e}")
    
    def _init_redis(self):
        """初始化Redis连接"""
        try:
            redis_config = {
                'host': os.getenv('REDIS_HOST', 'localhost'),
                'port': int(os.getenv('REDIS_PORT', '6379')),
                'db': int(os.getenv('REDIS_DB', '0')),
                'socket_connect_timeout': 5,
                'socket_timeout': 5
            }
            
            # 如果配置了密码，则添加密码参数
            redis_password = os.getenv('REDIS_PASSWORD')
            if redis_password:
                redis_config['password'] = redis_password
            
            self.redis_client = redis.Redis(**redis_config)
            # 测试连接
            self.redis_client.ping()
            self.redis_connected = True
            logger.info("✅ Redis 连接成功")
        except Exception as e:
            self.redis_connected = False
            logger.warning(f"⚠️ Redis 连接失败，缓存功能将不可用: {e}")
    
    def is_postgres_available(self) -> bool:
        """检查PostgreSQL连接状态"""
        return self.pg_connected and self.pg_conn is not None
    
    def is_redis_available(self) -> bool:
        """检查Redis连接状态"""
        return self.redis_connected and self.redis_client is not None
    
    def get_connection_status(self) -> Dict[str, Any]:
        """获取连接状态信息"""
        return {
            "postgres": {
                "connected": self.is_postgres_available(),
                "host": os.getenv('POSTGRES_HOST', 'localhost'),
                "port": os.getenv('POSTGRES_PORT', '5432'),
                "database": os.getenv('POSTGRES_DB', 'phoenixcoder')
            },
            "redis": {
                "connected": self.is_redis_available(),
                "host": os.getenv('REDIS_HOST', 'localhost'),
                "port": os.getenv('REDIS_PORT', '6379'),
                "database": os.getenv('REDIS_DB', '0')
            }
        }

    def _init_db(self):
        """确保数据库表结构存在"""
        # 在生产环境中，应该通过运行init_db.sql脚本初始化数据库
        # 这里只做简单检查
        with self.pg_conn.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.tables 
                    WHERE table_name = 'users'
                )
            """)
            exists = cursor.fetchone()[0]
            if not exists:
                raise Exception("数据库表结构未初始化，请先运行init_db.sql脚本")

    def get_user_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        if not self.is_postgres_available():
            logger.warning("数据库连接不可用，无法获取用户信息")
            return None
            
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            row = cursor.fetchone()
            if row:
                return User(**row)
            return None

    def get_user_by_phone(self, phone: str) -> Optional[User]:
        """通过手机号获取用户"""
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
            row = cursor.fetchone()
            if row:
                return User(**row)
            return None

    def get_user_by_sub(self, sub: str) -> Optional[User]:
        """通过sub获取用户"""
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE sub = %s", (sub,))
            row = cursor.fetchone()
            if row:
                return User(**row)
            return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """通过id获取用户"""
        if not self.is_postgres_available():
            logger.warning("数据库连接不可用，无法获取用户信息")
            return None
            
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if row:
                return User(**row)
            return None

    def create_user(self, user_create: UserCreate) -> User:
        """创建新用户"""
        if not self.is_postgres_available():
            raise RuntimeError("数据库连接不可用，无法创建用户")
            
        from datetime import datetime, timezone
        current_time = int(datetime.now(timezone.utc).timestamp())
        
        # 哈希密码
        hashed_password = bcrypt.hashpw(user_create.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user_data = {
            'sub': f"user_{int(time.time())}",
            'email': user_create.email,
            'name': user_create.name,
            'password': hashed_password,
            'user_type': user_create.user_type.value,
            'avatar': None,
            'is_active': True,
            'created_at': current_time,
            'updated_at': current_time
        }
        
        # 检查用户是否已存在（通过邮箱或手机号）
        if user_create.email:
            existing_user = self.get_user_by_email(user_create.email)
            if existing_user:
                raise Exception("邮箱已被注册")
        
        user = User(**user_data)

        with self.pg_conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (
                    sub, email, name, password, user_type, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user.sub,
                    user.email,
                    user.name,
                    user.password,
                    user.user_type,
                    current_time,
                    current_time
                )
            )
            self.pg_conn.commit()

        return user

    def update_user(self, sub: str, user_update: UserUpdate) -> Optional[User]:
        """更新用户信息"""
        user = self.get_user_by_sub(sub)
        if not user:
            return None

        from datetime import datetime, timezone
        current_time = datetime.now(timezone.utc)
        updated_fields = {k: v for k, v in user_update.dict(exclude_unset=True).items()}
        updated_fields['updated_at'] = current_time

        # 更新用户对象
        for key, value in updated_fields.items():
            setattr(user, key, value)

        # 构建更新语句
        set_clause = ", ".join([f"{k} = %s" for k in updated_fields.keys()])
        params = list(updated_fields.values()) + [sub]

        with self.pg_conn.cursor() as cursor:
            cursor.execute(f"UPDATE users SET {set_clause} WHERE sub = %s", params)
            self.pg_conn.commit()

        return user

    def delete_user(self, sub: str) -> bool:
        """删除用户"""
        with self.pg_conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE sub = %s", (sub,))
            self.pg_conn.commit()
            return cursor.rowcount > 0

    def list_users(self) -> List[User]:
        """列出所有用户"""
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users")
            rows = cursor.fetchall()
            return [User(**row) for row in rows]

    def get_user_by_wechat_openid(self, openid: str) -> Optional[User]:
        """通过微信openid获取用户"""
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT u.* FROM users u
                JOIN wechat_users wu ON u.sub = wu.user_sub
                WHERE wu.openid = %s
                """,
                (openid,)
            )
            row = cursor.fetchone()
            if row:
                return User(**row)
            return None

    def create_wechat_user(self, openid: str, nickname: str, avatar_url: str, user_type: str) -> User:
        """创建微信用户"""
        # 检查用户是否已存在
        existing_user = self.get_user_by_wechat_openid(openid)
        if existing_user:
            return existing_user

        # 创建新用户
        from datetime import datetime, timezone
        import secrets
        current_time = datetime.now(timezone.utc)
        sub = f"user_{int(current_time.timestamp())}"
        email = f"wechat_{openid}@example.com"

        # 生成随机密码
        password = secrets.token_urlsafe(16) + "1A"  # 确保包含数字和字母
        
        # 哈希密码
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        user = User(
            sub=sub,
            email=email,
            name=nickname,
            password=hashed_password,
            user_type=user_type,
            avatar=avatar_url,
            created_at=current_time,
            updated_at=current_time
        )

        # 开始事务
        try:
            with self.pg_conn.cursor() as cursor:
                # 插入用户
                cursor.execute(
                    """
                    INSERT INTO users (
                        sub, email, name, password, user_type, avatar, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user.sub,
                        user.email,
                        user.name,
                        user.password,
                        user.user_type,
                        user.avatar,
                        int(user.created_at.timestamp()),
                        int(user.updated_at.timestamp())
                    )
                )

                # 插入微信用户关联
                cursor.execute(
                    """
                    INSERT INTO wechat_users (
                        openid, user_sub, unionid, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        openid,
                        user.sub,
                        None,
                        int(current_time.timestamp()),
                        int(current_time.timestamp())
                    )
                )

            self.pg_conn.commit()
            return user
        except Exception as e:
            self.pg_conn.rollback()
            raise e

        # 此方法已迁移到WechatService类中

    def get_application_by_client_id(self, client_id: str) -> Optional[Dict[str, Any]]:
        """通过client_id获取应用信息"""
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM applications WHERE client_id = %s", (client_id,))
            row = cursor.fetchone()
            return row if row else None

    def save_auth_code(self, code: str, client_id: str, user_sub: str, redirect_uri: str, scope: str, state: Optional[str]) -> None:
        """保存授权码"""
        current_time = int(time.time())
        expires_at = current_time + 600  # 10分钟过期
        
        # 如果user_sub为空字符串，则设置为None以符合数据库约束
        user_sub_value = user_sub if user_sub else None

        with self.pg_conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO auth_codes (
                    code, client_id, user_sub, redirect_uri, scope, state, expires_at, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (code) DO UPDATE SET
                    user_sub = EXCLUDED.user_sub
                """,
                (
                    code,
                    client_id,
                    user_sub_value,
                    redirect_uri,
                    scope,
                    state,
                    expires_at,
                    current_time
                )
            )
            self.pg_conn.commit()

    def get_auth_code(self, code: str) -> Optional[Dict[str, Any]]:
        """获取授权码信息"""
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM auth_codes WHERE code = %s", (code,))
            row = cursor.fetchone()
            if row and row['expires_at'] > int(time.time()):
                return row
            return None

    def delete_auth_code(self, code: str) -> None:
        """删除授权码"""
        with self.pg_conn.cursor() as cursor:
            cursor.execute("DELETE FROM auth_codes WHERE code = %s", (code,))
            self.pg_conn.commit()

    def mark_auth_code_as_used(self, code: str) -> None:
        """标记授权码为已使用（通过删除实现）"""
        self.delete_auth_code(code)

    def store_authorization_code(self, code: str, user_id: str, client_id: str, redirect_uri: str, expires_in: int = 600):
        """存储授权码"""
        if not self.is_redis_available():
            logger.warning("Redis 连接不可用，无法存储授权码")
            return
            
        code_data = {
            'user_id': user_id,
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'created_at': int(time.time())
        }
        self.redis_client.setex(f"auth_code:{code}", expires_in, str(code_data))

    def get_authorization_code(self, code: str) -> Optional[Dict[str, Any]]:
        """获取授权码信息"""
        if not self.is_redis_available():
            logger.warning("Redis 连接不可用，无法获取授权码")
            return None
            
        code_data = self.redis_client.get(f"auth_code:{code}")
        if code_data:
            import ast
            return ast.literal_eval(code_data.decode('utf-8'))
        return None

    def delete_authorization_code(self, code: str):
        """删除授权码"""
        if not self.is_redis_available():
            logger.warning("Redis 连接不可用，无法删除授权码")
            return
            
        self.redis_client.delete(f"auth_code:{code}")

    def store_access_token(self, token: str, user_id: str, client_id: str, expires_in: int = 3600):
        """存储访问令牌"""
        if not self.is_redis_available():
            logger.warning("Redis 连接不可用，无法存储访问令牌")
            return
            
        token_data = {
            'user_id': user_id,
            'client_id': client_id,
            'created_at': int(time.time())
        }
        self.redis_client.setex(f"access_token:{token}", expires_in, str(token_data))

    def get_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """获取访问令牌信息"""
        if not self.is_redis_available():
            logger.warning("Redis 连接不可用，无法获取访问令牌")
            return None
            
        token_data = self.redis_client.get(f"access_token:{token}")
        if token_data:
            import ast
            return ast.literal_eval(token_data.decode('utf-8'))
        return None