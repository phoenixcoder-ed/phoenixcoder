"""
用户仓储实现
基于SQLAlchemy 2.0的现代化数据访问层
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import uuid

from .base import BaseRepository
from database.models.user import User, UserProfile, UserSession, UserType, UserStatus
from shared.exceptions import (
    UserNotFoundError, 
    UserAlreadyExistsError,
    InvalidCredentialsError
)

class UserRepository(BaseRepository[User]):
    """用户仓储实现"""

    def __init__(self, session: AsyncSession):
        self.session = session

    # 实现BaseRepository的抽象方法
    async def create(self, entity: User) -> User:
        """创建实体"""
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        return entity

    async def get_by_id(self, entity_id: str) -> Optional[User]:
        """根据ID获取实体"""
        stmt = select(User).where(
            and_(
                User.id == entity_id,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[User]:
        """更新实体"""
        stmt = (
            update(User)
            .where(User.id == entity_id)
            .values(**updates, updated_at=func.now())
            .returning(User)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()

    async def delete(self, entity_id: str) -> bool:
        """删除实体（软删除）"""
        stmt = (
            update(User)
            .where(User.id == entity_id)
            .values(deleted_at=func.now(), updated_at=func.now())
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[User]:
        """列表查询"""
        stmt = select(User).where(User.deleted_at.is_(None))
        
        if filters:
            for key, value in filters.items():
                if hasattr(User, key):
                    stmt = stmt.where(getattr(User, key) == value)
        
        stmt = stmt.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        stmt = select(func.count(User.id)).where(User.deleted_at.is_(None))
        
        if filters:
            for key, value in filters.items():
                if hasattr(User, key):
                    stmt = stmt.where(getattr(User, key) == value)
        
        result = await self.session.execute(stmt)
        return result.scalar()

    async def create_user(
        self,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        username: Optional[str] = None,
        name: str = "",
        password_hash: Optional[str] = None,
        user_type: UserType = UserType.DEVELOPER,
        **kwargs
    ) -> User:
        """创建用户"""
        
        # 检查用户是否已存在
        if email and await self.get_by_email(email):
            raise UserAlreadyExistsError(f"邮箱 {email} 已被注册")
        
        if phone and await self.get_by_phone(phone):
            raise UserAlreadyExistsError(f"手机号 {phone} 已被注册")
        
        if username and await self.get_by_username(username):
            raise UserAlreadyExistsError(f"用户名 {username} 已被注册")

        # 生成sub标识符
        sub = f"user_{uuid.uuid4().hex[:16]}"
        
        # 创建用户对象
        user = User(
            sub=sub,
            email=email,
            phone=phone,
            username=username,
            name=name or email or phone or username,
            password_hash=password_hash,
            user_type=user_type,
            status=UserStatus.PENDING,
            **kwargs
        )

        return await self.create(user)

    async def get_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        stmt = select(User).where(
            and_(
                User.email == email,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Optional[User]:
        """通过手机号获取用户"""
        stmt = select(User).where(
            and_(
                User.phone == phone,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """通过用户名获取用户"""
        stmt = select(User).where(
            and_(
                User.username == username,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_sub(self, sub: str) -> Optional[User]:
        """通过sub获取用户"""
        stmt = select(User).where(
            and_(
                User.sub == sub,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_credentials(
        self, 
        identifier: str, 
        identifier_type: str = "auto"
    ) -> Optional[User]:
        """
        通过凭据获取用户（智能识别）
        
        Args:
            identifier: 用户标识符（邮箱/手机号/用户名）
            identifier_type: 标识符类型，auto为自动识别
        """
        if identifier_type == "auto":
            # 自动识别类型
            if "@" in identifier:
                return await self.get_by_email(identifier)
            elif identifier.isdigit() and len(identifier) == 11:
                return await self.get_by_phone(identifier)
            else:
                return await self.get_by_username(identifier)
        elif identifier_type == "email":
            return await self.get_by_email(identifier)
        elif identifier_type == "phone":
            return await self.get_by_phone(identifier)
        elif identifier_type == "username":
            return await self.get_by_username(identifier)
        else:
            raise ValueError(f"不支持的标识符类型: {identifier_type}")

    async def update_login_info(
        self, 
        user_id: str, 
        ip_address: Optional[str] = None
    ) -> User:
        """更新登录信息"""
        user = await self.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"用户 {user_id} 不存在")

        # 更新登录统计
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(
                login_count=User.login_count + 1,
                last_login_at=func.now(),
                last_login_ip=ip_address,
                updated_at=func.now()
            )
            .returning(User)
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one()

    async def update_password(self, user_id: str, password_hash: str) -> User:
        """更新用户密码"""
        user = await self.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"用户 {user_id} 不存在")

        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(
                password_hash=password_hash,
                updated_at=func.now()
            )
            .returning(User)
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one()

    async def activate_user(self, user_id: str) -> User:
        """激活用户"""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(
                status=UserStatus.ACTIVE,
                is_verified=True,
                updated_at=func.now()
            )
            .returning(User)
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one()

    async def deactivate_user(self, user_id: str) -> User:
        """停用用户"""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(
                status=UserStatus.INACTIVE,
                is_active=False,
                updated_at=func.now()
            )
            .returning(User)
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one()

    async def soft_delete_user(self, user_id: str) -> bool:
        """软删除用户"""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(
                deleted_at=func.now(),
                is_active=False,
                updated_at=func.now()
            )
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def list_users(
        self,
        user_type: Optional[UserType] = None,
        status: Optional[UserStatus] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None
    ) -> List[User]:
        """列出用户"""
        stmt = select(User).where(User.deleted_at.is_(None))

        # 添加过滤条件
        if user_type:
            stmt = stmt.where(User.user_type == user_type)
        
        if status:
            stmt = stmt.where(User.status == status)
        
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        # 搜索功能
        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.username.ilike(search_pattern)
                )
            )

        # 分页和排序
        stmt = stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_users(
        self,
        user_type: Optional[UserType] = None,
        status: Optional[UserStatus] = None,
        is_active: Optional[bool] = None
    ) -> int:
        """统计用户数量"""
        stmt = select(func.count(User.id)).where(User.deleted_at.is_(None))

        if user_type:
            stmt = stmt.where(User.user_type == user_type)
        
        if status:
            stmt = stmt.where(User.status == status)
        
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        result = await self.session.execute(stmt)
        return result.scalar()

    async def get_user_statistics(self) -> Dict[str, Any]:
        """获取用户统计信息"""
        # 总用户数
        total_users = await self.count_users()
        
        # 活跃用户数
        active_users = await self.count_users(is_active=True)
        
        # 按类型统计
        type_stats = {}
        for user_type in UserType:
            count = await self.count_users(user_type=user_type)
            type_stats[user_type.value] = count

        # 按状态统计
        status_stats = {}
        for status in UserStatus:
            count = await self.count_users(status=status)
            status_stats[status.value] = count

        # 最近注册用户数（7天内）
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        stmt = select(func.count(User.id)).where(
            and_(
                User.created_at >= seven_days_ago,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(stmt)
        recent_registrations = result.scalar()

        return {
            "total_users": total_users,
            "active_users": active_users,
            "type_statistics": type_stats,
            "status_statistics": status_stats,
            "recent_registrations": recent_registrations
        }

class UserSessionRepository:
    """用户会话仓储"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(
        self,
        user_id: str,
        session_token: str,
        refresh_token: Optional[str] = None,
        expires_at: datetime = None,
        device_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> UserSession:
        """创建用户会话"""
        if not expires_at:
            expires_at = datetime.utcnow() + timedelta(hours=24)

        session_obj = UserSession(
            user_id=user_id,
            session_token=session_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            device_id=device_id,
            user_agent=user_agent,
            ip_address=ip_address
        )

        self.session.add(session_obj)
        await self.session.commit()
        await self.session.refresh(session_obj)
        return session_obj

    async def get_by_token(self, session_token: str) -> Optional[UserSession]:
        """通过会话令牌获取会话"""
        stmt = select(UserSession).where(
            and_(
                UserSession.session_token == session_token,
                UserSession.expires_at > func.now()
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def refresh_session(
        self, 
        refresh_token: str, 
        new_session_token: str,
        new_expires_at: datetime
    ) -> Optional[UserSession]:
        """刷新会话"""
        stmt = (
            update(UserSession)
            .where(
                and_(
                    UserSession.refresh_token == refresh_token,
                    UserSession.expires_at > func.now()
                )
            )
            .values(
                session_token=new_session_token,
                expires_at=new_expires_at,
                last_accessed_at=func.now()
            )
            .returning(UserSession)
        )
        
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()

    async def revoke_session(self, session_token: str) -> bool:
        """撤销会话"""
        stmt = delete(UserSession).where(
            UserSession.session_token == session_token
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def revoke_user_sessions(self, user_id: str) -> int:
        """撤销用户所有会话"""
        stmt = delete(UserSession).where(UserSession.user_id == user_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

    async def cleanup_expired_sessions(self) -> int:
        """清理过期会话"""
        stmt = delete(UserSession).where(UserSession.expires_at <= func.now())
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount