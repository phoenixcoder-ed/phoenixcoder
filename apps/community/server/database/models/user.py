"""
用户数据模型
使用SQLAlchemy 2.0定义数据库表结构
"""

from typing import Optional
from enum import Enum

from sqlalchemy import String, Boolean, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base


class UserType(str, Enum):
    """用户类型枚举"""
    DEVELOPER = "developer"  # 开发者
    EMPLOYER = "employer"    # 雇主
    ADMIN = "admin"          # 管理员


class UserStatus(str, Enum):
    """用户状态枚举"""
    PENDING = "pending"      # 待激活
    ACTIVE = "active"        # 已激活
    SUSPENDED = "suspended"  # 已暂停
    BANNED = "banned"        # 已封禁

class User(Base):
    """用户表模型 - 匹配实际数据库表结构"""
    __tablename__ = "users"

    # 主键 - OIDC标准字段
    sub: Mapped[str] = mapped_column(
        String(255),
        primary_key=True,
        nullable=False,
        comment="OIDC subject标识符"
    )
    
    # 基本信息 - 只包含数据库中实际存在的字段
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="用户邮箱"
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="用户显示名称"
    )
    
    # 认证信息
    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="密码哈希值"
    )
    
    # 用户属性
    user_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="用户类型"
    )
    
    # 个人信息
    avatar: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="用户头像URL"
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="是否激活"
    )
    
    # 时间戳 - 使用bigint类型匹配数据库
    created_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="创建时间戳"
    )
    
    updated_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="更新时间戳"
    )

    def __repr__(self) -> str:
        return f"<User(sub='{self.sub}', email='{self.email}', name='{self.name}')>"


class UserProfile(Base):
    """用户档案表模型"""
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        nullable=False,
        comment="档案ID"
    )
    
    user_sub: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=False,
        comment="用户sub标识符"
    )
    
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="个人简介"
    )
    
    location: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="所在地"
    )
    
    website: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="个人网站"
    )
    
    github_username: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="GitHub用户名"
    )
    
    created_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="创建时间戳"
    )
    
    updated_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="更新时间戳"
    )

    def __repr__(self) -> str:
        return f"<UserProfile(id='{self.id}', user_sub='{self.user_sub}')>"


class UserSession(Base):
    """用户会话表模型"""
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        nullable=False,
        comment="会话ID"
    )
    
    user_sub: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=False,
        comment="用户sub标识符"
    )
    
    session_token: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        comment="会话令牌"
    )
    
    refresh_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="刷新令牌"
    )
    
    expires_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="过期时间戳"
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="是否活跃"
    )
    
    created_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="创建时间戳"
    )
    
    updated_at: Mapped[int] = mapped_column(
        nullable=False,
        comment="更新时间戳"
    )

    def __repr__(self) -> str:
        return f"<UserSession(id='{self.id}', user_sub='{self.user_sub}', is_active={self.is_active})>"