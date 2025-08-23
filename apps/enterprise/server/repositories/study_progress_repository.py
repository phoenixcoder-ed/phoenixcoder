"""
学习进度仓储层
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from repositories.base import BaseRepository
from database.models.answer_record import StudyProgress


class StudyProgressRepository(BaseRepository[StudyProgress]):
    """学习进度仓储实现"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, entity: Dict[str, Any]) -> StudyProgress:
        """创建学习进度记录"""
        import uuid
        if 'id' not in entity:
            entity['id'] = str(uuid.uuid4())
        progress = StudyProgress(**entity)
        self.session.add(progress)
        await self.session.commit()
        await self.session.refresh(progress)
        return progress
    
    async def get_by_id(self, entity_id: str) -> Optional[StudyProgress]:
        """根据ID获取学习进度"""
        result = await self.session.execute(
            select(StudyProgress).where(StudyProgress.id == entity_id)
        )
        return result.scalar_one_or_none()
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[StudyProgress]:
        """更新学习进度"""
        result = await self.session.execute(
            select(StudyProgress).where(StudyProgress.id == entity_id)
        )
        progress = result.scalar_one_or_none()
        if progress:
            for key, value in updates.items():
                setattr(progress, key, value)
            await self.session.commit()
            await self.session.refresh(progress)
        return progress
    
    async def delete(self, entity_id: str) -> bool:
        """删除学习进度"""
        result = await self.session.execute(
            select(StudyProgress).where(StudyProgress.id == entity_id)
        )
        progress = result.scalar_one_or_none()
        if progress:
            await self.session.delete(progress)
            await self.session.commit()
            return True
        return False
    
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[StudyProgress]:
        """列表查询学习进度"""
        query = select(StudyProgress)
        if filters:
            for key, value in filters.items():
                if hasattr(StudyProgress, key):
                    query = query.where(getattr(StudyProgress, key) == value)
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        query = select(func.count(StudyProgress.id))
        if filters:
            for key, value in filters.items():
                if hasattr(StudyProgress, key):
                    query = query.where(getattr(StudyProgress, key) == value)
        result = await self.session.execute(query)
        return result.scalar()
    
    async def get_user_progress(self, user_id: str) -> List[StudyProgress]:
        """获取用户学习进度"""
        stmt = select(StudyProgress).where(StudyProgress.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_category_progress(self, user_id: str, category: str) -> Optional[StudyProgress]:
        """获取用户特定分类的学习进度"""
        stmt = select(StudyProgress).where(
            and_(
                StudyProgress.user_id == user_id,
                StudyProgress.category == category
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update_progress(
        self,
        user_id: str,
        category: str,
        is_correct: bool,
        difficulty: str,
        time_spent: int,
        score: float
    ) -> StudyProgress:
        """更新学习进度"""
        # 查找现有进度记录
        progress = await self.get_category_progress(user_id, category)
        
        if not progress:
            # 创建新的进度记录
            import uuid
            progress = StudyProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                category=category,
                total_questions=1,
                completed_questions=1,
                correct_questions=1 if is_correct else 0,
                easy_completed=1 if difficulty == "EASY" else 0,
                medium_completed=1 if difficulty == "MEDIUM" else 0,
                hard_completed=1 if difficulty == "HARD" else 0,
                total_time_spent=time_spent,
                average_score=score,
                mastery_level="BEGINNER",
                last_activity_at=datetime.utcnow()
            )
            self.session.add(progress)
        else:
            # 更新现有记录
            progress.completed_questions += 1
            if is_correct:
                progress.correct_questions += 1
            
            if difficulty == "EASY":
                progress.easy_completed += 1
            elif difficulty == "MEDIUM":
                progress.medium_completed += 1
            elif difficulty == "HARD":
                progress.hard_completed += 1
            
            progress.total_time_spent += time_spent
            
            # 重新计算平均分
            total_score = progress.average_score * (progress.completed_questions - 1) + score
            progress.average_score = total_score / progress.completed_questions
            
            # 更新熟练度等级
            accuracy_rate = progress.correct_questions / progress.completed_questions
            if accuracy_rate >= 0.9 and progress.completed_questions >= 20:
                progress.mastery_level = "EXPERT"
            elif accuracy_rate >= 0.7 and progress.completed_questions >= 10:
                progress.mastery_level = "INTERMEDIATE"
            else:
                progress.mastery_level = "BEGINNER"
            
            progress.last_activity_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(progress)
        return progress
    
    async def get_progress_statistics(self, user_id: str) -> Dict[str, Any]:
        """获取用户学习进度统计"""
        stmt = select(StudyProgress).where(StudyProgress.user_id == user_id)
        result = await self.session.execute(stmt)
        progress_list = result.scalars().all()
        
        if not progress_list:
            return {
                "total_categories": 0,
                "total_completed": 0,
                "total_correct": 0,
                "overall_accuracy": 0.0,
                "total_time_spent": 0,
                "average_score": 0.0,
                "mastery_distribution": {
                    "BEGINNER": 0,
                    "INTERMEDIATE": 0,
                    "EXPERT": 0
                }
            }
        
        total_completed = sum(p.completed_questions for p in progress_list)
        total_correct = sum(p.correct_questions for p in progress_list)
        total_time_spent = sum(p.total_time_spent for p in progress_list)
        
        # 计算加权平均分
        weighted_score_sum = sum(p.average_score * p.completed_questions for p in progress_list)
        average_score = weighted_score_sum / total_completed if total_completed > 0 else 0.0
        
        # 统计熟练度分布
        mastery_distribution = {
            "BEGINNER": 0,
            "INTERMEDIATE": 0,
            "EXPERT": 0
        }
        for progress in progress_list:
            mastery_distribution[progress.mastery_level] += 1
        
        return {
            "total_categories": len(progress_list),
            "total_completed": total_completed,
            "total_correct": total_correct,
            "overall_accuracy": total_correct / total_completed if total_completed > 0 else 0.0,
            "total_time_spent": total_time_spent,
            "average_score": average_score,
            "mastery_distribution": mastery_distribution
        }
    
    async def get_recent_activity(self, user_id: str, days: int = 7) -> List[StudyProgress]:
        """获取用户最近的学习活动"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        stmt = select(StudyProgress).where(
            and_(
                StudyProgress.user_id == user_id,
                StudyProgress.last_activity_at >= cutoff_date
            )
        ).order_by(StudyProgress.last_activity_at.desc())
        
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_category_rankings(self, category: str, limit: int = 10) -> List[Dict[str, Any]]:
        """获取分类排行榜"""
        stmt = select(StudyProgress).where(
            StudyProgress.category == category
        ).order_by(
            StudyProgress.average_score.desc(),
            StudyProgress.correct_questions.desc()
        ).limit(limit)
        
        result = await self.session.execute(stmt)
        progress_list = result.scalars().all()
        
        rankings = []
        for i, progress in enumerate(progress_list, 1):
            rankings.append({
                "rank": i,
                "user_id": progress.user_id,
                "category": progress.category,
                "completed_questions": progress.completed_questions,
                "correct_questions": progress.correct_questions,
                "accuracy_rate": progress.correct_questions / progress.completed_questions if progress.completed_questions > 0 else 0.0,
                "average_score": progress.average_score,
                "mastery_level": progress.mastery_level
            })
        
        return rankings