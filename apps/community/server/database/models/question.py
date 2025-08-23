"""
题目数据模型
使用SQLAlchemy 2.0定义数据库表结构
"""

from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
import enum


class DifficultyLevel(enum.Enum):
    """题目难度级别"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionType(enum.Enum):
    """题目类型"""
    SINGLE_CHOICE = "single_choice"      # 单选题
    MULTIPLE_CHOICE = "multiple_choice"  # 多选题
    TRUE_FALSE = "true_false"           # 判断题
    ESSAY = "essay"                     # 简答题
    CODING = "coding"                   # 编程题


class Question(Base):
    """题目模型"""
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False, comment="题目标题")
    description = Column(Text, nullable=True, comment="题目描述")
    content = Column(Text, nullable=True, comment="题目详细内容")
    
    # 题目类型和难度
    type = Column(SQLEnum(QuestionType), nullable=False, comment="题目类型")
    difficulty = Column(SQLEnum(DifficultyLevel), nullable=False, comment="难度级别")
    category = Column(String(100), nullable=False, comment="题目分类")
    tags = Column(JSON, nullable=True, comment="题目标签")
    
    # 选择题相关字段
    options = Column(JSON, nullable=True, comment="选择题选项")
    correct_answer = Column(Text, nullable=True, comment="正确答案")
    
    # 编程题相关字段
    input_example = Column(Text, nullable=True, comment="输入示例")
    output_example = Column(Text, nullable=True, comment="输出示例")
    test_cases = Column(JSON, nullable=True, comment="测试用例")
    time_limit = Column(Integer, nullable=True, comment="时间限制(ms)")
    memory_limit = Column(Integer, nullable=True, comment="内存限制(KB)")
    
    # 题目状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    is_public = Column(Boolean, default=True, comment="是否公开")
    
    # 统计信息
    view_count = Column(Integer, default=0, comment="查看次数")
    attempt_count = Column(Integer, default=0, comment="尝试次数")
    pass_count = Column(Integer, default=0, comment="通过次数")
    
    # 创建者信息
    created_by = Column(String(36), nullable=True, comment="创建者ID")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    answer_records = relationship("AnswerRecord", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, title={self.title}, type={self.type.value})>"