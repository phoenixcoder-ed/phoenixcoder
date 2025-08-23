"""
任务数据模型
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

class TaskStatus(str, Enum):
    """任务状态枚举"""
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class TaskPriority(str, Enum):
    """任务优先级枚举"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskType(str, Enum):
    """任务类型枚举"""
    DEVELOPMENT = "development"
    DESIGN = "design"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    CONSULTATION = "consultation"
    MAINTENANCE = "maintenance"
    OTHER = "other"

class ApplicationStatus(str, Enum):
    """申请状态枚举"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class Task(Base):
    """任务表模型"""
    __tablename__ = "tasks"

    # 主键
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="任务唯一标识符"
    )
    
    # 基本信息
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="任务标题"
    )
    
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="任务描述"
    )
    
    requirements: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="任务要求"
    )
    
    # 任务属性
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        nullable=False,
        default=TaskStatus.DRAFT,
        comment="任务状态"
    )
    
    priority: Mapped[TaskPriority] = mapped_column(
        SQLEnum(TaskPriority),
        nullable=False,
        default=TaskPriority.MEDIUM,
        comment="任务优先级"
    )
    
    task_type: Mapped[TaskType] = mapped_column(
        SQLEnum(TaskType),
        nullable=False,
        default=TaskType.DEVELOPMENT,
        comment="任务类型"
    )
    
    # 关联信息
    publisher_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=False,
        comment="发布者ID"
    )
    
    assignee_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=True,
        comment="接受者ID"
    )
    
    # 技能要求
    required_skills: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="所需技能（JSON格式）"
    )
    
    # 时间信息
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="截止时间"
    )
    
    estimated_hours: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="预估工时"
    )
    
    # 报酬信息
    budget: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="预算"
    )
    
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="CNY",
        comment="货币类型"
    )
    
    # 联系信息
    contact_info: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="联系方式"
    )
    
    # 统计信息
    view_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="查看次数"
    )
    
    application_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="申请次数"
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
    publisher = relationship("User", foreign_keys="Task.publisher_id", back_populates="published_tasks")
    assignee = relationship("User", foreign_keys="Task.assignee_id", back_populates="assigned_tasks")
    applications = relationship("TaskApplication", back_populates="task")

    # 表级约束
    __table_args__ = (
        # 预算必须为正数
        CheckConstraint("budget IS NULL OR budget > 0", name="ck_tasks_budget_positive"),
        # 预估工时必须为正数
        CheckConstraint("estimated_hours IS NULL OR estimated_hours > 0", name="ck_tasks_hours_positive"),
        # 截止时间必须在未来
        CheckConstraint("deadline IS NULL OR deadline > created_at", name="ck_tasks_deadline_future"),
        # 索引
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_priority", "priority"),
        Index("ix_tasks_publisher_id", "publisher_id"),
        Index("ix_tasks_assignee_id", "assignee_id"),
        Index("ix_tasks_created_at", "created_at"),
        Index("ix_tasks_deadline", "deadline"),
    )


class TaskApplication(Base):
    """任务申请表模型"""
    __tablename__ = "task_applications"

    # 主键
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="申请唯一标识符"
    )
    
    # 关联信息
    task_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tasks.id"),
        nullable=False,
        comment="任务ID"
    )
    
    applicant_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("users.sub"),
        nullable=False,
        comment="申请者ID"
    )
    
    # 申请信息
    status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus),
        nullable=False,
        default=ApplicationStatus.PENDING,
        comment="申请状态"
    )
    
    message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="申请留言"
    )
    
    proposed_price: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="报价"
    )
    
    estimated_completion_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="预计完成时间"
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="申请时间"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间"
    )

    # 关系
    task = relationship("Task", back_populates="applications")
    applicant = relationship("User", back_populates="task_applications")

    # 表级约束
    __table_args__ = (
        # 每个用户对每个任务只能申请一次
        UniqueConstraint("task_id", "applicant_id", name="uq_task_applications_task_applicant"),
        # 报价必须为正数
        CheckConstraint("proposed_price IS NULL OR proposed_price > 0", name="ck_task_applications_price_positive"),
        # 索引
        Index("ix_task_applications_task_id", "task_id"),
        Index("ix_task_applications_applicant_id", "applicant_id"),
        Index("ix_task_applications_status", "status"),
        Index("ix_task_applications_created_at", "created_at"),
    )