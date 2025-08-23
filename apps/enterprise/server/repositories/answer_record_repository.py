"""
答题记录仓储层实现
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import uuid

from .base import BaseRepository
from database.models.answer_record import AnswerRecord, StudyProgress, AnswerResult, ProgrammingLanguage
from database.models.question import Question, DifficultyLevel


class AnswerRecordRepository(BaseRepository[AnswerRecord]):
    """答题记录仓储实现"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, answer_record: AnswerRecord) -> AnswerRecord:
        """创建答题记录"""
        self.session.add(answer_record)
        await self.session.commit()
        await self.session.refresh(answer_record)
        return answer_record
    
    async def get_by_id(self, record_id: str) -> Optional[AnswerRecord]:
        """根据ID获取答题记录"""
        stmt = (
            select(AnswerRecord)
            .options(selectinload(AnswerRecord.question))
            .where(AnswerRecord.id == record_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update(self, record_id: str, updates: Dict[str, Any]) -> Optional[AnswerRecord]:
        """更新答题记录"""
        record = await self.get_by_id(record_id)
        if not record:
            return None
        
        for key, value in updates.items():
            if hasattr(record, key):
                setattr(record, key, value)
        
        await self.session.commit()
        await self.session.refresh(record)
        return record
    
    async def delete(self, record_id: str) -> bool:
        """删除答题记录"""
        record = await self.get_by_id(record_id)
        if not record:
            return False
        
        await self.session.delete(record)
        await self.session.commit()
        return True
    
    async def list(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Optional[Dict[str, Any]] = None
    ) -> List[AnswerRecord]:
        """列表查询答题记录"""
        stmt = select(AnswerRecord).options(selectinload(AnswerRecord.question))
        
        if filters:
            if "user_id" in filters and filters["user_id"]:
                stmt = stmt.where(AnswerRecord.user_id == filters["user_id"])
            
            if "question_id" in filters and filters["question_id"]:
                stmt = stmt.where(AnswerRecord.question_id == filters["question_id"])
            
            if "result" in filters and filters["result"]:
                stmt = stmt.where(AnswerRecord.result == AnswerResult(filters["result"]))
            
            if "language" in filters and filters["language"]:
                stmt = stmt.where(AnswerRecord.language == ProgrammingLanguage(filters["language"]))
            
            if "is_correct" in filters:
                stmt = stmt.where(AnswerRecord.is_correct == filters["is_correct"])
        
        stmt = stmt.offset(skip).limit(limit).order_by(desc(AnswerRecord.submit_time))
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        stmt = select(func.count(AnswerRecord.id))
        
        if filters:
            if "user_id" in filters and filters["user_id"]:
                stmt = stmt.where(AnswerRecord.user_id == filters["user_id"])
            
            if "question_id" in filters and filters["question_id"]:
                stmt = stmt.where(AnswerRecord.question_id == filters["question_id"])
            
            if "result" in filters and filters["result"]:
                stmt = stmt.where(AnswerRecord.result == AnswerResult(filters["result"]))
        
        result = await self.session.execute(stmt)
        return result.scalar()
    
    async def get_user_records(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[AnswerRecord]:
        """获取用户的答题记录"""
        stmt = (
            select(AnswerRecord)
            .options(selectinload(AnswerRecord.question))
            .where(AnswerRecord.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(desc(AnswerRecord.submit_time))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_question_records(
        self, 
        question_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[AnswerRecord]:
        """获取题目的答题记录"""
        stmt = (
            select(AnswerRecord)
            .where(AnswerRecord.question_id == question_id)
            .offset(skip)
            .limit(limit)
            .order_by(desc(AnswerRecord.submit_time))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_wrong_answers(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[AnswerRecord]:
        """获取用户的错题记录"""
        stmt = (
            select(AnswerRecord)
            .options(selectinload(AnswerRecord.question))
            .where(and_(
                AnswerRecord.user_id == user_id,
                AnswerRecord.is_correct == False
            ))
            .offset(skip)
            .limit(limit)
            .order_by(desc(AnswerRecord.submit_time))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_user_best_record(self, user_id: str, question_id: str) -> Optional[AnswerRecord]:
        """获取用户在某题目上的最佳记录"""
        stmt = (
            select(AnswerRecord)
            .where(and_(
                AnswerRecord.user_id == user_id,
                AnswerRecord.question_id == question_id
            ))
            .order_by(desc(AnswerRecord.score), AnswerRecord.execution_time)
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """获取用户答题统计"""
        # 总答题数
        total_stmt = select(func.count(AnswerRecord.id)).where(AnswerRecord.user_id == user_id)
        total_result = await self.session.execute(total_stmt)
        total_count = total_result.scalar()
        
        # 正确答题数
        correct_stmt = select(func.count(AnswerRecord.id)).where(
            and_(AnswerRecord.user_id == user_id, AnswerRecord.is_correct == True)
        )
        correct_result = await self.session.execute(correct_stmt)
        correct_count = correct_result.scalar()
        
        # 平均得分
        avg_score_stmt = select(func.avg(AnswerRecord.score)).where(AnswerRecord.user_id == user_id)
        avg_score_result = await self.session.execute(avg_score_stmt)
        avg_score = avg_score_result.scalar() or 0.0
        
        # 总学习时间
        total_time_stmt = select(func.sum(AnswerRecord.time_spent)).where(AnswerRecord.user_id == user_id)
        total_time_result = await self.session.execute(total_time_stmt)
        total_time = total_time_result.scalar() or 0
        
        # 按语言统计
        language_stmt = (
            select(AnswerRecord.language, func.count(AnswerRecord.id))
            .where(AnswerRecord.user_id == user_id)
            .group_by(AnswerRecord.language)
        )
        language_result = await self.session.execute(language_stmt)
        language_stats = {row[0].value if row[0] else "unknown": row[1] for row in language_result.fetchall()}
        
        return {
            "total_count": total_count,
            "correct_count": correct_count,
            "accuracy_rate": correct_count / total_count if total_count > 0 else 0.0,
            "average_score": float(avg_score),
            "total_time_spent": total_time,
            "language_stats": language_stats
        }
    
    async def get_daily_activity(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """获取用户每日答题活动"""
        start_date = datetime.now() - timedelta(days=days)
        
        stmt = (
            select(
                func.date(AnswerRecord.submit_time).label("date"),
                func.count(AnswerRecord.id).label("count"),
                func.sum(func.case((AnswerRecord.is_correct == True, 1), else_=0)).label("correct_count")
            )
            .where(and_(
                AnswerRecord.user_id == user_id,
                AnswerRecord.submit_time >= start_date
            ))
            .group_by(func.date(AnswerRecord.submit_time))
            .order_by(func.date(AnswerRecord.submit_time))
        )
        
        result = await self.session.execute(stmt)
        return [
            {
                "date": row.date.isoformat(),
                "count": row.count,
                "correct_count": row.correct_count
            }
            for row in result.fetchall()
        ]


class StudyProgressRepository(BaseRepository[StudyProgress]):
    """学习进度仓储实现"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, progress: StudyProgress) -> StudyProgress:
        """创建学习进度"""
        self.session.add(progress)
        await self.session.commit()
        await self.session.refresh(progress)
        return progress
    
    async def get_by_id(self, progress_id: str) -> Optional[StudyProgress]:
        """根据ID获取学习进度"""
        stmt = select(StudyProgress).where(StudyProgress.id == progress_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update(self, progress_id: str, updates: Dict[str, Any]) -> Optional[StudyProgress]:
        """更新学习进度"""
        progress = await self.get_by_id(progress_id)
        if not progress:
            return None
        
        for key, value in updates.items():
            if hasattr(progress, key):
                setattr(progress, key, value)
        
        await self.session.commit()
        await self.session.refresh(progress)
        return progress
    
    async def delete(self, progress_id: str) -> bool:
        """删除学习进度"""
        progress = await self.get_by_id(progress_id)
        if not progress:
            return False
        
        await self.session.delete(progress)
        await self.session.commit()
        return True
    
    async def list(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Optional[Dict[str, Any]] = None
    ) -> List[StudyProgress]:
        """列表查询学习进度"""
        stmt = select(StudyProgress)
        
        if filters:
            if "user_id" in filters and filters["user_id"]:
                stmt = stmt.where(StudyProgress.user_id == filters["user_id"])
            
            if "category" in filters and filters["category"]:
                stmt = stmt.where(StudyProgress.category == filters["category"])
        
        stmt = stmt.offset(skip).limit(limit).order_by(desc(StudyProgress.last_activity_at))
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        stmt = select(func.count(StudyProgress.id))
        
        if filters:
            if "user_id" in filters and filters["user_id"]:
                stmt = stmt.where(StudyProgress.user_id == filters["user_id"])
            
            if "category" in filters and filters["category"]:
                stmt = stmt.where(StudyProgress.category == filters["category"])
        
        result = await self.session.execute(stmt)
        return result.scalar()
    
    async def get_user_progress(self, user_id: str) -> List[StudyProgress]:
        """获取用户的学习进度"""
        stmt = (
            select(StudyProgress)
            .where(StudyProgress.user_id == user_id)
            .order_by(desc(StudyProgress.mastery_level))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_or_create_progress(self, user_id: str, category: str) -> StudyProgress:
        """获取或创建学习进度"""
        stmt = select(StudyProgress).where(
            and_(StudyProgress.user_id == user_id, StudyProgress.category == category)
        )
        result = await self.session.execute(stmt)
        progress = result.scalar_one_or_none()
        
        if not progress:
            progress = StudyProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                category=category
            )
            progress = await self.create(progress)
        
        return progress
    
    async def update_progress(
        self, 
        user_id: str, 
        category: str, 
        is_correct: bool, 
        difficulty: DifficultyLevel,
        time_spent: int,
        score: float
    ) -> StudyProgress:
        """更新学习进度"""
        progress = await self.get_or_create_progress(user_id, category)
        
        # 更新统计信息
        progress.completed_questions += 1
        if is_correct:
            progress.correct_questions += 1
        
        # 更新难度分布
        if difficulty == DifficultyLevel.EASY:
            progress.easy_completed += 1
        elif difficulty == DifficultyLevel.MEDIUM:
            progress.medium_completed += 1
        elif difficulty == DifficultyLevel.HARD:
            progress.hard_completed += 1
        
        # 更新时间和分数
        progress.total_time_spent += time_spent
        progress.average_score = (
            (progress.average_score * (progress.completed_questions - 1) + score) / 
            progress.completed_questions
        )
        
        # 计算掌握程度
        accuracy = progress.correct_questions / progress.completed_questions
        progress.mastery_level = min(accuracy * (progress.completed_questions / 10), 1.0)
        
        progress.last_activity_at = datetime.now()
        
        await self.session.commit()
        await self.session.refresh(progress)
        return progress