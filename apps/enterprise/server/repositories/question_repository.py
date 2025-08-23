"""
题目仓储层实现
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from .base import BaseRepository
from database.models.question import Question, QuestionType, DifficultyLevel
from database.models.answer_record import AnswerRecord


class QuestionRepository(BaseRepository[Question]):
    """题目仓储实现"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, question: Question) -> Question:
        """创建题目"""
        self.session.add(question)
        await self.session.commit()
        await self.session.refresh(question)
        return question
    
    async def get_by_id(self, question_id: str) -> Optional[Question]:
        """根据ID获取题目"""
        stmt = select(Question).where(Question.id == question_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update(self, question_id: str, updates: Dict[str, Any]) -> Optional[Question]:
        """更新题目"""
        question = await self.get_by_id(question_id)
        if not question:
            return None
        
        for key, value in updates.items():
            if hasattr(question, key):
                setattr(question, key, value)
        
        await self.session.commit()
        await self.session.refresh(question)
        return question
    
    async def delete(self, question_id: str) -> bool:
        """删除题目"""
        question = await self.get_by_id(question_id)
        if not question:
            return False
        
        await self.session.delete(question)
        await self.session.commit()
        return True
    
    async def list(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Question]:
        """列表查询题目"""
        stmt = select(Question).where(Question.is_active == True)
        
        if filters:
            if "category" in filters and filters["category"]:
                stmt = stmt.where(Question.category == filters["category"])
            
            if "difficulty" in filters and filters["difficulty"]:
                stmt = stmt.where(Question.difficulty == DifficultyLevel(filters["difficulty"]))
            
            if "type" in filters and filters["type"]:
                stmt = stmt.where(Question.type == QuestionType(filters["type"]))
            
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                stmt = stmt.where(
                    or_(
                        Question.title.ilike(search_term),
                        Question.description.ilike(search_term)
                    )
                )
            
            if "tags" in filters and filters["tags"]:
                # 假设tags是JSON数组，这里简化处理
                for tag in filters["tags"]:
                    stmt = stmt.where(Question.tags.contains([tag]))
        
        stmt = stmt.offset(skip).limit(limit).order_by(Question.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        stmt = select(func.count(Question.id)).where(Question.is_active == True)
        
        if filters:
            if "category" in filters and filters["category"]:
                stmt = stmt.where(Question.category == filters["category"])
            
            if "difficulty" in filters and filters["difficulty"]:
                stmt = stmt.where(Question.difficulty == DifficultyLevel(filters["difficulty"]))
            
            if "type" in filters and filters["type"]:
                stmt = stmt.where(Question.type == QuestionType(filters["type"]))
            
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                stmt = stmt.where(
                    or_(
                        Question.title.ilike(search_term),
                        Question.description.ilike(search_term)
                    )
                )
        
        result = await self.session.execute(stmt)
        return result.scalar()
    
    async def get_by_category(self, category: str, limit: int = 10) -> List[Question]:
        """根据分类获取题目"""
        stmt = (
            select(Question)
            .where(and_(Question.category == category, Question.is_active == True))
            .limit(limit)
            .order_by(Question.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_by_difficulty(self, difficulty: DifficultyLevel, limit: int = 10) -> List[Question]:
        """根据难度获取题目"""
        stmt = (
            select(Question)
            .where(and_(Question.difficulty == difficulty, Question.is_active == True))
            .limit(limit)
            .order_by(Question.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_random_questions(self, count: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Question]:
        """获取随机题目"""
        stmt = select(Question).where(Question.is_active == True)
        
        if filters:
            if "category" in filters and filters["category"]:
                stmt = stmt.where(Question.category == filters["category"])
            
            if "difficulty" in filters and filters["difficulty"]:
                stmt = stmt.where(Question.difficulty == DifficultyLevel(filters["difficulty"]))
        
        stmt = stmt.order_by(func.random()).limit(count)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def increment_view_count(self, question_id: str) -> bool:
        """增加查看次数"""
        question = await self.get_by_id(question_id)
        if not question:
            return False
        
        question.view_count += 1
        await self.session.commit()
        return True
    
    async def increment_attempt_count(self, question_id: str) -> bool:
        """增加尝试次数"""
        question = await self.get_by_id(question_id)
        if not question:
            return False
        
        question.attempt_count += 1
        await self.session.commit()
        return True
    
    async def increment_pass_count(self, question_id: str) -> bool:
        """增加通过次数"""
        question = await self.get_by_id(question_id)
        if not question:
            return False
        
        question.pass_count += 1
        await self.session.commit()
        return True
    
    async def get_categories(self) -> List[str]:
        """获取所有分类"""
        stmt = select(Question.category).distinct().where(Question.is_active == True)
        result = await self.session.execute(stmt)
        return [row[0] for row in result.fetchall()]
    
    async def get_statistics(self) -> Dict[str, Any]:
        """获取题目统计信息"""
        # 总题目数
        total_stmt = select(func.count(Question.id)).where(Question.is_active == True)
        total_result = await self.session.execute(total_stmt)
        total_count = total_result.scalar()
        
        # 按难度分组统计
        difficulty_stmt = (
            select(Question.difficulty, func.count(Question.id))
            .where(Question.is_active == True)
            .group_by(Question.difficulty)
        )
        difficulty_result = await self.session.execute(difficulty_stmt)
        difficulty_stats = {row[0].value: row[1] for row in difficulty_result.fetchall()}
        
        # 按分类分组统计
        category_stmt = (
            select(Question.category, func.count(Question.id))
            .where(Question.is_active == True)
            .group_by(Question.category)
        )
        category_result = await self.session.execute(category_stmt)
        category_stats = {row[0]: row[1] for row in category_result.fetchall()}
        
        return {
            "total_count": total_count,
            "difficulty_stats": difficulty_stats,
            "category_stats": category_stats
        }