"""
任务仓储实现
负责任务数据的持久化操作
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from .base import BaseRepository
from database.models.task import Task, TaskApplication, TaskStatus, TaskPriority
from database.base import DatabaseManager


class TaskRepository(BaseRepository[Task]):
    """任务仓储实现"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def create(self, entity: Task) -> Task:
        """创建任务"""
        async with self.db_manager.get_session() as session:
            session.add(entity)
            await session.commit()
            await session.refresh(entity)
            return entity
    
    async def get_by_id(self, entity_id: str) -> Optional[Task]:
        """根据ID获取任务"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Task).where(Task.id == entity_id)
            )
            return result.scalar_one_or_none()
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[Task]:
        """更新任务"""
        async with self.db_manager.get_session() as session:
            # 添加更新时间
            updates['updated_at'] = datetime.utcnow()
            
            result = await session.execute(
                update(Task)
                .where(Task.id == entity_id)
                .values(**updates)
                .returning(Task)
            )
            await session.commit()
            return result.scalar_one_or_none()
    
    async def delete(self, entity_id: str) -> bool:
        """删除任务（软删除）"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                update(Task)
                .where(Task.id == entity_id)
                .values(is_deleted=True, updated_at=datetime.utcnow())
            )
            await session.commit()
            return result.rowcount > 0
    
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[Task]:
        """列表查询"""
        async with self.db_manager.get_session() as session:
            query = select(Task).where(Task.is_deleted == False)
            
            # 应用过滤条件
            if filters:
                query = self._apply_filters(query, filters)
            
            # 排序
            query = query.order_by(Task.created_at.desc())
            
            # 分页
            query = query.offset(skip).limit(limit)
            
            result = await session.execute(query)
            return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        async with self.db_manager.get_session() as session:
            query = select(func.count(Task.id)).where(Task.is_deleted == False)
            
            if filters:
                query = self._apply_filters(query, filters)
            
            result = await session.execute(query)
            return result.scalar()
    
    async def get_by_creator(self, creator_id: str, skip: int = 0, limit: int = 100) -> List[Task]:
        """获取用户创建的任务"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Task)
                .where(and_(Task.creator_id == creator_id, Task.is_deleted == False))
                .order_by(Task.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def get_by_assignee(self, assignee_id: str, skip: int = 0, limit: int = 100) -> List[Task]:
        """获取分配给用户的任务"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Task)
                .where(and_(Task.assignee_id == assignee_id, Task.is_deleted == False))
                .order_by(Task.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def get_by_status(self, status: TaskStatus, skip: int = 0, limit: int = 100) -> List[Task]:
        """根据状态获取任务"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Task)
                .where(and_(Task.status == status, Task.is_deleted == False))
                .order_by(Task.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def search(self, keyword: str, skip: int = 0, limit: int = 100) -> List[Task]:
        """搜索任务"""
        async with self.db_manager.get_session() as session:
            search_pattern = f"%{keyword}%"
            result = await session.execute(
                select(Task)
                .where(and_(
                    or_(
                        Task.title.ilike(search_pattern),
                        Task.description.ilike(search_pattern),
                        Task.tags.ilike(search_pattern)
                    ),
                    Task.is_deleted == False
                ))
                .order_by(Task.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def get_overdue_tasks(self) -> List[Task]:
        """获取过期任务"""
        async with self.db_manager.get_session() as session:
            now = datetime.utcnow()
            result = await session.execute(
                select(Task)
                .where(and_(
                    Task.deadline < now,
                    Task.status.in_([TaskStatus.OPEN, TaskStatus.IN_PROGRESS]),
                    Task.is_deleted == False
                ))
            )
            return result.scalars().all()
    
    async def get_statistics(self, creator_id: Optional[str] = None) -> Dict[str, int]:
        """获取任务统计"""
        async with self.db_manager.get_session() as session:
            base_query = select(func.count(Task.id)).where(Task.is_deleted == False)
            
            if creator_id:
                base_query = base_query.where(Task.creator_id == creator_id)
            
            # 总任务数
            total_result = await session.execute(base_query)
            total = total_result.scalar()
            
            # 各状态任务数
            stats = {"total": total}
            for status in TaskStatus:
                status_query = base_query.where(Task.status == status)
                status_result = await session.execute(status_query)
                stats[status.value] = status_result.scalar()
            
            return stats
    
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """应用过滤条件"""
        if "status" in filters:
            query = query.where(Task.status == filters["status"])
        
        if "priority" in filters:
            query = query.where(Task.priority == filters["priority"])
        
        if "creator_id" in filters:
            query = query.where(Task.creator_id == filters["creator_id"])
        
        if "assignee_id" in filters:
            query = query.where(Task.assignee_id == filters["assignee_id"])
        
        if "skills" in filters:
            skills = filters["skills"]
            if isinstance(skills, list):
                # 检查任务是否包含任一技能
                conditions = [Task.required_skills.ilike(f"%{skill}%") for skill in skills]
                query = query.where(or_(*conditions))
        
        if "min_budget" in filters:
            query = query.where(Task.budget >= filters["min_budget"])
        
        if "max_budget" in filters:
            query = query.where(Task.budget <= filters["max_budget"])
        
        if "deadline_before" in filters:
            query = query.where(Task.deadline <= filters["deadline_before"])
        
        if "deadline_after" in filters:
            query = query.where(Task.deadline >= filters["deadline_after"])
        
        return query


class TaskApplicationRepository(BaseRepository[TaskApplication]):
    """任务申请仓储实现"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def create(self, entity: TaskApplication) -> TaskApplication:
        """创建任务申请"""
        async with self.db_manager.get_session() as session:
            session.add(entity)
            await session.commit()
            await session.refresh(entity)
            return entity
    
    async def get_by_id(self, entity_id: str) -> Optional[TaskApplication]:
        """根据ID获取任务申请"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(TaskApplication).where(TaskApplication.id == entity_id)
            )
            return result.scalar_one_or_none()
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[TaskApplication]:
        """更新任务申请"""
        async with self.db_manager.get_session() as session:
            updates['updated_at'] = datetime.utcnow()
            
            result = await session.execute(
                update(TaskApplication)
                .where(TaskApplication.id == entity_id)
                .values(**updates)
                .returning(TaskApplication)
            )
            await session.commit()
            return result.scalar_one_or_none()
    
    async def delete(self, entity_id: str) -> bool:
        """删除任务申请"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                delete(TaskApplication).where(TaskApplication.id == entity_id)
            )
            await session.commit()
            return result.rowcount > 0
    
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[TaskApplication]:
        """列表查询"""
        async with self.db_manager.get_session() as session:
            query = select(TaskApplication)
            
            if filters:
                if "task_id" in filters:
                    query = query.where(TaskApplication.task_id == filters["task_id"])
                if "applicant_id" in filters:
                    query = query.where(TaskApplication.applicant_id == filters["applicant_id"])
                if "status" in filters:
                    query = query.where(TaskApplication.status == filters["status"])
            
            query = query.order_by(TaskApplication.created_at.desc())
            query = query.offset(skip).limit(limit)
            
            result = await session.execute(query)
            return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        async with self.db_manager.get_session() as session:
            query = select(func.count(TaskApplication.id))
            
            if filters:
                if "task_id" in filters:
                    query = query.where(TaskApplication.task_id == filters["task_id"])
                if "applicant_id" in filters:
                    query = query.where(TaskApplication.applicant_id == filters["applicant_id"])
                if "status" in filters:
                    query = query.where(TaskApplication.status == filters["status"])
            
            result = await session.execute(query)
            return result.scalar()
    
    async def get_by_task_and_user(self, task_id: str, user_id: str) -> Optional[TaskApplication]:
        """获取用户对特定任务的申请"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(TaskApplication)
                .where(and_(
                    TaskApplication.task_id == task_id,
                    TaskApplication.applicant_id == user_id
                ))
            )
            return result.scalar_one_or_none()
    
    async def exists_application(self, task_id: str, user_id: str) -> bool:
        """检查用户是否已申请任务"""
        application = await self.get_by_task_and_user(task_id, user_id)
        return application is not None