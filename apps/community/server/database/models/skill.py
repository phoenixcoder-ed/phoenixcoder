"""
技能数据模型
使用SQLAlchemy 2.0定义数据库表结构
"""

from sqlalchemy import (
    String, Boolean, DateTime, Text, Enum as SQLEnum, Integer, Numeric,
    ForeignKey, Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from typing import Optional, List
import uuid

from ..base import Base

class SkillCategory(str, Enum):
    """技能分类枚举"""
    PROGRAMMING = "programming"
    FRONTEND = "frontend"
    BACKEND = "backend"
    MOBILE = "mobile"
    DEVOPS = "devops"
    DATABASE = "database"
    DESIGN = "design"
    TESTING = "testing"
    PROJECT_MANAGEMENT = "project_management"
    DATA_SCIENCE = "data_science"
    AI_ML = "ai_ml"
    SECURITY = "security"
    OTHER = "other"

class SkillLevel(str, Enum):
    """技能等级枚举"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    MASTER = "master"

class Skill(Base):
    """技能表模型"""
    __tablename__ = "skills"

    # 主键
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="技能唯一标识符"
    )
    
    # 基本信息
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        comment="技能名称"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="技能描述"
    )
    
    category: Mapped[SkillCategory] = mapped_column(
        SQLEnum(SkillCategory),
        nullable=False,
        comment="技能分类"
    )
    
    # 标签和关键词
    tags: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="技能标签（JSON格式）"
    )
    
    keywords: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="搜索关键词"
    )
    
    # 验证状态
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="是否已验证"
    )
    
    verified_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.sub"),
        nullable=True,
        comment="验证者ID"
    )
    
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="验证时间"
    )
    
    # 统计信息
    user_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="拥有该技能的用户数量"
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
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="是否已删除"
    )

    # 关系
    user_skills = relationship("UserSkill", back_populates="skill")
    verifier = relationship("User", foreign_keys=[verified_by])

    # 表级约束
    __table_args__ = (
        # 用户数量必须非负
        CheckConstraint("user_count >= 0", name="ck_skills_user_count_non_negative"),
        # 索引
        Index("ix_skills_name", "name"),
        Index("ix_skills_category", "category"),
        Index("ix_skills_is_verified", "is_verified"),
        Index("ix_skills_is_deleted", "is_deleted"),
        Index("ix_skills_user_count", "user_count"),
    )


class UserSkill(Base):
    """用户技能表模型"""
    __tablename__ = "user_skills"

    # 主键
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="用户技能唯一标识符"
    )
    
    # 关联信息
    user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=False,
        comment="用户ID"
    )
    
    skill_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("skills.id"),
        nullable=False,
        comment="技能ID"
    )
    
    # 技能信息
    level: Mapped[SkillLevel] = mapped_column(
        SQLEnum(SkillLevel),
        nullable=False,
        default=SkillLevel.BEGINNER,
        comment="技能等级"
    )
    
    experience_years: Mapped[Optional[float]] = mapped_column(
        Numeric(4, 1),
        nullable=True,
        comment="经验年数"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="技能描述"
    )
    
    # 证书和认证
    certificates: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="相关证书（JSON格式）"
    )
    
    # 验证状态
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="是否已验证"
    )
    
    verified_by: Mapped[Optional[str]] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=True,
        comment="验证者ID"
    )
    
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="验证时间"
    )
    
    # 评分信息
    self_rating: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="自评分数（1-10）"
    )
    
    peer_rating: Mapped[Optional[float]] = mapped_column(
        Numeric(3, 1),
        nullable=True,
        comment="同行评分"
    )
    
    rating_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="评分次数"
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

    # 关系
    user = relationship("User", foreign_keys=[user_id], back_populates="user_skills")
    skill = relationship("Skill", back_populates="user_skills")
    verifier = relationship("User", foreign_keys=[verified_by])

    # 表级约束
    __table_args__ = (
        # 每个用户对每个技能只能有一条记录
        UniqueConstraint("user_id", "skill_id", name="uq_user_skills_user_skill"),
        # 经验年数必须非负
        CheckConstraint("experience_years IS NULL OR experience_years >= 0", name="ck_user_skills_experience_non_negative"),
        # 自评分数范围
        CheckConstraint("self_rating IS NULL OR (self_rating >= 1 AND self_rating <= 10)", name="ck_user_skills_self_rating_range"),
        # 同行评分范围
        CheckConstraint("peer_rating IS NULL OR (peer_rating >= 1.0 AND peer_rating <= 10.0)", name="ck_user_skills_peer_rating_range"),
        # 评分次数必须非负
        CheckConstraint("rating_count >= 0", name="ck_user_skills_rating_count_non_negative"),
        # 索引
        Index("ix_user_skills_user_id", "user_id"),
        Index("ix_user_skills_skill_id", "skill_id"),
        Index("ix_user_skills_level", "level"),
        Index("ix_user_skills_is_verified", "is_verified"),
        Index("ix_user_skills_created_at", "created_at"),
    )