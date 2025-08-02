import os
import time
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
from models import User, UserCreate, UserUpdate, WechatLoginRequest
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class DatabaseService:
    def __init__(self):
        # 初始化PostgreSQL连接
        self.pg_conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432'),
            dbname=os.getenv('POSTGRES_DB', 'phoenixcoder'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', 'password')
        )
        # 初始化Redis客户端
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=os.getenv('REDIS_PORT', '6379'),
            db=os.getenv('REDIS_DB', '0')
        )
        # 确保表结构存在
        self._init_db()

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

    def create_user(self, user_create: UserCreate) -> User:
        """创建新用户"""
        current_time = int(time.time())
        sub = f"user_{current_time}"
        
        # 检查用户是否已存在（通过邮箱或手机号）
        if user_create.email:
            existing_user = self.get_user_by_email(user_create.email)
            if existing_user:
                raise Exception("邮箱已被注册")
        
        if user_create.phone:
            existing_user = self.get_user_by_phone(user_create.phone)
            if existing_user:
                raise Exception("手机号已被注册")
        
        user = User(
            sub=sub,
            email=user_create.email,
            phone=user_create.phone,
            name=user_create.name,
            password=user_create.password,
            user_type=user_create.user_type,
            created_at=current_time,
            updated_at=current_time
        )

        with self.pg_conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (
                    sub, email, phone, name, password, user_type, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user.sub,
                    user.email,
                    user.phone,
                    user.name,
                    user.password,
                    user.user_type,
                    user.created_at,
                    user.updated_at
                )
            )
            self.pg_conn.commit()

        return user

    def update_user(self, sub: str, user_update: UserUpdate) -> Optional[User]:
        """更新用户信息"""
        user = self.get_user_by_sub(sub)
        if not user:
            return None

        current_time = int(time.time())
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
        current_time = int(time.time())
        sub = f"user_{current_time}"
        email = f"wechat_{openid}@example.com"

        # 生成随机密码
        import secrets
        password = secrets.token_urlsafe(16)

        user = User(
            sub=sub,
            email=email,
            name=nickname,
            password=password,
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
                        user.created_at,
                        user.updated_at
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
                        current_time,
                        current_time
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

        with self.pg_conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO auth_codes (
                    code, client_id, user_sub, redirect_uri, scope, state, expires_at, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    code,
                    client_id,
                    user_sub,
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