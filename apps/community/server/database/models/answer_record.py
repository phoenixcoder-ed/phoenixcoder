"""
答题记录数据模型
使用SQLAlchemy 2.0定义数据库表结构
"""

from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, JSON, Enum as SQLEnum, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
import enum


class AnswerResult(enum.Enum):
    """答题结果"""
    PASS = "pass"           # 通过
    FAIL = "fail"           # 失败
    PARTIAL = "partial"     # 部分通过
    TIMEOUT = "timeout"     # 超时
    ERROR = "error"         # 运行错误


class ProgrammingLanguage(enum.Enum):
    """编程语言"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    GO = "go"
    RUST = "rust"
    TYPESCRIPT = "typescript"


class MasteryLevel(enum.Enum):
    """掌握程度等级"""
    BEGINNER = "beginner"       # 初学者
    NOVICE = "novice"          # 新手
    INTERMEDIATE = "intermediate"  # 中级
    ADVANCED = "advanced"      # 高级
    EXPERT = "expert"          # 专家


class AnswerRecord(Base):
    """答题记录模型"""
    __tablename__ = "answer_records"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("users.sub"), nullable=False, comment="用户ID")
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False, comment="题目ID")
    
    # 答题内容
    answer_content = Column(Text, nullable=True, comment="答题内容")
    code = Column(Text, nullable=True, comment="提交的代码")
    language = Column(SQLEnum(ProgrammingLanguage), nullable=True, comment="编程语言")
    
    # 答题结果
    result = Column(SQLEnum(AnswerResult), nullable=False, comment="答题结果")
    score = Column(Float, default=0.0, comment="得分")
    is_correct = Column(Boolean, default=False, comment="是否正确")
    
    # 编程题相关
    test_cases_passed = Column(Integer, default=0, comment="通过的测试用例数")
    total_test_cases = Column(Integer, default=0, comment="总测试用例数")
    execution_time = Column(Integer, nullable=True, comment="执行时间(ms)")
    memory_used = Column(Integer, nullable=True, comment="内存占用(KB)")
    
    # 错误信息
    error_message = Column(Text, nullable=True, comment="错误信息")
    compile_error = Column(Text, nullable=True, comment="编译错误")
    
    # 提示使用情况
    hints_used = Column(Integer, default=0, comment="使用提示次数")
    
    # 时间统计
    start_time = Column(DateTime(timezone=True), nullable=True, comment="开始答题时间")
    submit_time = Column(DateTime(timezone=True), server_default=func.now(), comment="提交时间")
    time_spent = Column(Integer, nullable=True, comment="答题耗时(秒)")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="answer_records")
    question = relationship("Question", back_populates="answer_records")

    def __repr__(self):
        return f"<AnswerRecord(id={self.id}, user_id={self.user_id}, question_id={self.question_id}, result={self.result.value})>"


class StudyProgress(Base):
    """学习进度模型"""
    __tablename__ = "study_progress"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("users.sub"), nullable=False, comment="用户ID")
    category = Column(String(100), nullable=False, comment="知识点分类")
    
    # 进度统计
    total_questions = Column(Integer, default=0, comment="总题目数")
    completed_questions = Column(Integer, default=0, comment="已完成题目数")
    correct_questions = Column(Integer, default=0, comment="答对题目数")
    
    # 难度分布
    easy_completed = Column(Integer, default=0, comment="简单题完成数")
    medium_completed = Column(Integer, default=0, comment="中等题完成数")
    hard_completed = Column(Integer, default=0, comment="困难题完成数")
    
    # 统计信息
    total_time_spent = Column(Integer, default=0, comment="总学习时间(秒)")
    average_score = Column(Float, default=0.0, comment="平均得分")
    mastery_level = Column(SQLEnum(MasteryLevel), default=MasteryLevel.BEGINNER, comment="掌握程度等级")
    
    # 最近活动
    last_activity_at = Column(DateTime(timezone=True), nullable=True, comment="最近活动时间")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="study_progress")

    def __repr__(self):
        return f"<StudyProgress(id={self.id}, user_id={self.user_id}, category={self.category})>"