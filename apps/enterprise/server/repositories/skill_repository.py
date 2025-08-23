"""
技能仓储实现
负责技能数据的持久化操作
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from .base import BaseRepository
from database.models.skill import Skill, UserSkill, SkillCategory, SkillLevel
from database.base import DatabaseManager


class SkillRepository(BaseRepository[Skill]):
    """技能仓储实现"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def create(self, entity: Skill) -> Skill:
        """创建技能"""
        async with self.db_manager.get_session() as session:
            session.add(entity)
            await session.commit()
            await session.refresh(entity)
            return entity
    
    async def get_by_id(self, entity_id: str) -> Optional[Skill]:
        """根据ID获取技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Skill).where(Skill.id == entity_id)
            )
            return result.scalar_one_or_none()
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[Skill]:
        """更新技能"""
        async with self.db_manager.get_session() as session:
            updates['updated_at'] = datetime.utcnow()
            
            result = await session.execute(
                update(Skill)
                .where(Skill.id == entity_id)
                .values(**updates)
                .returning(Skill)
            )
            await session.commit()
            return result.scalar_one_or_none()
    
    async def delete(self, entity_id: str) -> bool:
        """删除技能（软删除）"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                update(Skill)
                .where(Skill.id == entity_id)
                .values(is_deleted=True, updated_at=datetime.utcnow())
            )
            await session.commit()
            return result.rowcount > 0
    
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[Skill]:
        """列表查询"""
        async with self.db_manager.get_session() as session:
            query = select(Skill).where(Skill.is_deleted == False)
            
            # 应用过滤条件
            if filters:
                query = self._apply_filters(query, filters)
            
            # 排序
            query = query.order_by(Skill.name.asc())
            
            # 分页
            query = query.offset(skip).limit(limit)
            
            result = await session.execute(query)
            return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        async with self.db_manager.get_session() as session:
            query = select(func.count(Skill.id)).where(Skill.is_deleted == False)
            
            if filters:
                query = self._apply_filters(query, filters)
            
            result = await session.execute(query)
            return result.scalar()
    
    async def get_by_name(self, name: str) -> Optional[Skill]:
        """根据名称获取技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Skill).where(and_(
                    Skill.name == name,
                    Skill.is_deleted == False
                ))
            )
            return result.scalar_one_or_none()
    
    async def get_by_category(self, category: SkillCategory, skip: int = 0, limit: int = 100) -> List[Skill]:
        """根据分类获取技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(Skill)
                .where(and_(
                    Skill.category == category,
                    Skill.is_deleted == False
                ))
                .order_by(Skill.name.asc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def search(self, keyword: str, skip: int = 0, limit: int = 100) -> List[Skill]:
        """搜索技能"""
        async with self.db_manager.get_session() as session:
            search_pattern = f"%{keyword}%"
            result = await session.execute(
                select(Skill)
                .where(and_(
                    or_(
                        Skill.name.ilike(search_pattern),
                        Skill.description.ilike(search_pattern),
                        Skill.tags.ilike(search_pattern)
                    ),
                    Skill.is_deleted == False
                ))
                .order_by(Skill.name.asc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def get_popular_skills(self, limit: int = 20) -> List[Skill]:
        """获取热门技能（按用户数量排序）"""
        async with self.db_manager.get_session() as session:
            # 这里需要关联UserSkill表来统计用户数量
            # 简化实现，按创建时间排序
            result = await session.execute(
                select(Skill)
                .where(Skill.is_deleted == False)
                .order_by(Skill.created_at.desc())
                .limit(limit)
            )
            return result.scalars().all()
    
    async def exists_by_name(self, name: str) -> bool:
        """检查技能名称是否存在"""
        skill = await self.get_by_name(name)
        return skill is not None
    
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """应用过滤条件"""
        if "category" in filters:
            query = query.where(Skill.category == filters["category"])
        
        if "is_verified" in filters:
            query = query.where(Skill.is_verified == filters["is_verified"])
        
        if "tags" in filters:
            tags = filters["tags"]
            if isinstance(tags, list):
                conditions = [Skill.tags.ilike(f"%{tag}%") for tag in tags]
                query = query.where(or_(*conditions))
        
        return query


class UserSkillRepository(BaseRepository[UserSkill]):
    """用户技能仓储实现"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def create(self, entity: UserSkill) -> UserSkill:
        """创建用户技能"""
        async with self.db_manager.get_session() as session:
            session.add(entity)
            await session.commit()
            await session.refresh(entity)
            return entity
    
    async def get_by_id(self, entity_id: str) -> Optional[UserSkill]:
        """根据ID获取用户技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(UserSkill).where(UserSkill.id == entity_id)
            )
            return result.scalar_one_or_none()
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[UserSkill]:
        """更新用户技能"""
        async with self.db_manager.get_session() as session:
            updates['updated_at'] = datetime.utcnow()
            
            result = await session.execute(
                update(UserSkill)
                .where(UserSkill.id == entity_id)
                .values(**updates)
                .returning(UserSkill)
            )
            await session.commit()
            return result.scalar_one_or_none()
    
    async def delete(self, entity_id: str) -> bool:
        """删除用户技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                delete(UserSkill).where(UserSkill.id == entity_id)
            )
            await session.commit()
            return result.rowcount > 0
    
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[UserSkill]:
        """列表查询"""
        async with self.db_manager.get_session() as session:
            query = select(UserSkill)
            
            if filters:
                if "user_id" in filters:
                    query = query.where(UserSkill.user_id == filters["user_id"])
                if "skill_id" in filters:
                    query = query.where(UserSkill.skill_id == filters["skill_id"])
                if "level" in filters:
                    query = query.where(UserSkill.level == filters["level"])
                if "is_verified" in filters:
                    query = query.where(UserSkill.is_verified == filters["is_verified"])
            
            query = query.order_by(UserSkill.level.desc(), UserSkill.updated_at.desc())
            query = query.offset(skip).limit(limit)
            
            result = await session.execute(query)
            return result.scalars().all()
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        async with self.db_manager.get_session() as session:
            query = select(func.count(UserSkill.id))
            
            if filters:
                if "user_id" in filters:
                    query = query.where(UserSkill.user_id == filters["user_id"])
                if "skill_id" in filters:
                    query = query.where(UserSkill.skill_id == filters["skill_id"])
                if "level" in filters:
                    query = query.where(UserSkill.level == filters["level"])
                if "is_verified" in filters:
                    query = query.where(UserSkill.is_verified == filters["is_verified"])
            
            result = await session.execute(query)
            return result.scalar()
    
    async def get_by_user_and_skill(self, user_id: str, skill_id: str) -> Optional[UserSkill]:
        """获取用户的特定技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(UserSkill)
                .where(and_(
                    UserSkill.user_id == user_id,
                    UserSkill.skill_id == skill_id
                ))
            )
            return result.scalar_one_or_none()
    
    async def get_user_skills(self, user_id: str, skip: int = 0, limit: int = 100) -> List[UserSkill]:
        """获取用户的所有技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(UserSkill)
                .where(UserSkill.user_id == user_id)
                .order_by(UserSkill.level.desc(), UserSkill.updated_at.desc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def get_skill_users(self, skill_id: str, skip: int = 0, limit: int = 100) -> List[UserSkill]:
        """获取拥有特定技能的用户"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(UserSkill)
                .where(UserSkill.skill_id == skill_id)
                .order_by(UserSkill.level.desc(), UserSkill.updated_at.desc())
                .offset(skip)
                .limit(limit)
            )
            return result.scalars().all()
    
    async def get_user_skills_by_level(self, user_id: str, min_level: SkillLevel) -> List[UserSkill]:
        """获取用户指定等级以上的技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(UserSkill)
                .where(and_(
                    UserSkill.user_id == user_id,
                    UserSkill.level >= min_level
                ))
                .order_by(UserSkill.level.desc())
            )
            return result.scalars().all()
    
    async def get_verified_skills(self, user_id: str) -> List[UserSkill]:
        """获取用户已认证的技能"""
        async with self.db_manager.get_session() as session:
            result = await session.execute(
                select(UserSkill)
                .where(and_(
                    UserSkill.user_id == user_id,
                    UserSkill.is_verified == True
                ))
                .order_by(UserSkill.level.desc())
            )
            return result.scalars().all()
    
    async def exists_user_skill(self, user_id: str, skill_id: str) -> bool:
        """检查用户是否拥有特定技能"""
        user_skill = await self.get_by_user_and_skill(user_id, skill_id)
        return user_skill is not None
    
    async def get_user_skill_stats(self, user_id: str) -> Dict[str, int]:
        """获取用户技能统计"""
        async with self.db_manager.get_session() as session:
            # 总技能数
            total_result = await session.execute(
                select(func.count(UserSkill.id))
                .where(UserSkill.user_id == user_id)
            )
            total = total_result.scalar()
            
            # 已认证技能数
            verified_result = await session.execute(
                select(func.count(UserSkill.id))
                .where(and_(
                    UserSkill.user_id == user_id,
                    UserSkill.is_verified == True
                ))
            )
            verified = verified_result.scalar()
            
            # 各等级技能数
            stats = {
                "total": total,
                "verified": verified
            }
            
            for level in SkillLevel:
                level_result = await session.execute(
                    select(func.count(UserSkill.id))
                    .where(and_(
                        UserSkill.user_id == user_id,
                        UserSkill.level == level
                    ))
                )
                stats[level.value] = level_result.scalar()
            
            return stats