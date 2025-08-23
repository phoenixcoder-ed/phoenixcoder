"""
用户数据模型
使用SQLAlchemy 2.0定义数据库表结构
"""

from sqlalchemy import (
    String, Boolean, DateTime, Text, Enum as SQLEnum,
    Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from typing import Optional, List
import uuid

from ..base import Base

class UserType(str, Enum):
    """用户类型枚举"""
    ADMIN = "admin"
    DEVELOPER = "developer"
    EMPLOYER = "employer"
    GUEST = "guest"

class UserStatus(str, Enum):
    """用户状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class User(Base):
    """用户表模型"""
    __tablename__ = "users"

    # 主键
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="用户唯一标识符"
    )
    
    # OIDC标准字段
    sub: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="OIDC subject标识符"
    )
    
    # 基本信息
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
        comment="用户邮箱"
    )
    
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
        index=True,
        comment="用户手机号"
    )
    
    username: Mapped[Optional[str]] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
        index=True,
        comment="用户名"
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="用户显示名称"
    )
    
    # 认证信息
    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="密码哈希值"
    )
    
    # 用户属性
    user_type: Mapped[UserType] = mapped_column(
        SQLEnum(UserType),
        nullable=False,
        default=UserType.DEVELOPER,
        comment="用户类型"
    )
    
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus),
        nullable=False,
        default=UserStatus.PENDING,
        comment="用户状态"
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="是否激活"
    )
    
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="是否已验证"
    )
    
    # 个人信息
    avatar: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="用户头像URL"
    )
    
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="个人简介"
    )
    
    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="所在地"
    )
    
    website: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="个人网站"
    )
    
    # 统计信息
    login_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
        comment="登录次数"
    )
    
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="最后登录时间"
    )
    
    last_login_ip: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6最大长度
        nullable=True,
        comment="最后登录IP"
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="创建时间"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间"
    )
    
    # 软删除
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="删除时间"
    )

    # 关系
    published_tasks = relationship("Task", foreign_keys="Task.publisher_id", back_populates="publisher")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    task_applications = relationship("TaskApplication", back_populates="applicant")
    user_skills = relationship("UserSkill", foreign_keys="UserSkill.user_id", back_populates="user")
    answer_records = relationship("AnswerRecord", back_populates="user", cascade="all, delete-orphan")
    study_progress = relationship("StudyProgress", back_populates="user", cascade="all, delete-orphan")

    # 表级约束
    __table_args__ = (
        # 确保至少有一种联系方式
        CheckConstraint(
            "email IS NOT NULL OR phone IS NOT NULL OR username IS NOT NULL",
            name="ck_users_contact_required"
        ),
        # 用户名长度检查（SQLite兼容）
        CheckConstraint(
            "username IS NULL OR (length(username) >= 3 AND length(username) <= 50)",
            name="ck_users_username_length"
        ),
        # 复合索引
        Index("ix_users_type_status", "user_type", "status"),
        Index("ix_users_created_at", "created_at"),
        Index("ix_users_active_verified", "is_active", "is_verified"),
        # 软删除索引
        Index("ix_users_deleted_at", "deleted_at"),
        # 表注释
        {"comment": "用户表"}
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, sub={self.sub}, email={self.email})>"

class UserProfile(Base):
    """用户扩展信息表"""
    __tablename__ = "user_profiles"

    # 主键，关联用户表
    user_id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        comment="用户ID"
    )
    
    # 技能信息
    skills: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="技能标签（JSON格式）"
    )
    
    experience_years: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="工作经验年数"
    )
    
    # 偏好设置
    preferred_language: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        default="zh-CN",
        comment="首选语言"
    )
    
    timezone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        default="Asia/Shanghai",
        comment="时区"
    )
    
    # 通知设置
    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="邮件通知"
    )
    
    sms_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="短信通知"
    )
    
    # 隐私设置
    profile_visibility: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="public",
        comment="个人资料可见性"
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="创建时间"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间"
    )

    __table_args__ = (
        CheckConstraint(
            "experience_years IS NULL OR experience_years >= 0",
            name="ck_user_profiles_experience_positive"
        ),
        CheckConstraint(
            "profile_visibility IN ('public', 'private', 'friends')",
            name="ck_user_profiles_visibility_valid"
        ),
        {"comment": "用户扩展信息表"}
    )

class UserSession(Base):
    """用户会话表"""
    __tablename__ = "user_sessions"

    # 主键
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="会话ID"
    )
    
    # 关联用户
    user_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        comment="用户ID"
    )
    
    # 会话信息
    session_token: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        comment="会话令牌"
    )
    
    refresh_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
        comment="刷新令牌"
    )
    
    # 设备信息
    device_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="设备标识"
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="用户代理"
    )
    
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        comment="IP地址"
    )
    
    # 时间信息
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="过期时间"
    )
    
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="最后访问时间"
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="创建时间"
    )

    __table_args__ = (
        Index("ix_user_sessions_user_id", "user_id"),
        Index("ix_user_sessions_expires_at", "expires_at"),
        Index("ix_user_sessions_device_id", "device_id"),
        {"comment": "用户会话表"}
    )