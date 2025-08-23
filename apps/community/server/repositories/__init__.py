"""
仓储层模块
实现数据访问层，负责数据的持久化操作
"""

from .base import BaseRepository, UserRepository as BaseUserRepository
from .user_repository import UserRepository, UserSessionRepository
from .task_repository import TaskRepository, TaskApplicationRepository
from .skill_repository import SkillRepository, UserSkillRepository
from .question_repository import QuestionRepository
from .answer_record_repository import AnswerRecordRepository, StudyProgressRepository

__all__ = [
    # 基础仓储
    "BaseRepository",
    "BaseUserRepository",
    
    # 用户相关仓储
    "UserRepository",
    "UserSessionRepository",
    
    # 任务相关仓储
    "TaskRepository",
    "TaskApplicationRepository",
    
    # 技能相关仓储
    "SkillRepository",
    "UserSkillRepository",
    
    # 题目相关仓储
    "QuestionRepository",
    "AnswerRecordRepository",
    "StudyProgressRepository",
]