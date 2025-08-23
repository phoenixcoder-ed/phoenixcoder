"""
技能服务
提供技能管理和认证的核心业务逻辑
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import uuid

from repositories.skill_repository import SkillRepository
from repositories.user_repository import UserRepository
from database.models.skill import Skill, UserSkill, SkillCategory, SkillLevel
from database.models.user import UserType
from shared.exceptions import (
    SkillNotFoundError,
    ValidationError,
    PermissionDeniedError,
    BusinessLogicError
)


@dataclass
class SkillCreateData:
    """技能创建数据"""
    name: str
    description: str
    category: SkillCategory
    tags: List[str] = None
    prerequisites: List[str] = None
    learning_resources: List[str] = None


@dataclass
class UserSkillData:
    """用户技能数据"""
    skill_id: str
    level: SkillLevel
    experience_years: Optional[int] = None
    certifications: List[str] = None
    projects: List[str] = None
    self_assessment: Optional[int] = None  # 1-10 自评分数


@dataclass
class SkillAssessment:
    """技能评估"""
    id: str
    skill_id: str
    user_id: str
    assessor_id: Optional[str]
    score: int  # 1-100
    level: SkillLevel
    feedback: Optional[str]
    assessment_type: str  # 'self', 'peer', 'expert', 'automated'
    evidence_links: List[str]
    assessed_at: datetime


@dataclass
class SkillCertification:
    """技能认证"""
    id: str
    skill_id: str
    user_id: str
    certification_name: str
    issuer: str
    issue_date: datetime
    expiry_date: Optional[datetime]
    credential_id: Optional[str]
    verification_url: Optional[str]
    status: str  # 'active', 'expired', 'revoked'


@dataclass
class SkillSearchFilters:
    """技能搜索过滤器"""
    category: Optional[SkillCategory] = None
    tags: Optional[List[str]] = None
    search_text: Optional[str] = None
    user_id: Optional[str] = None
    min_level: Optional[SkillLevel] = None
    has_certification: Optional[bool] = None


@dataclass
class SkillStats:
    """技能统计"""
    total_skills: int
    user_skills_count: int
    certified_skills_count: int
    skill_distribution: Dict[str, int]
    level_distribution: Dict[str, int]
    top_skills: List[Dict[str, Any]]


class SkillService:
    """技能服务"""
    
    def __init__(
        self, 
        skill_repository: SkillRepository,
        user_repository: UserRepository
    ):
        self.skill_repo = skill_repository
        self.user_repo = user_repository

    async def create_skill(
        self, 
        skill_data: SkillCreateData,
        creator_id: str
    ) -> Skill:
        """创建技能"""
        
        # 验证创建者权限
        creator = await self.user_repo.get_by_id(creator_id)
        if not creator or creator.user_type != UserType.ADMIN:
            raise PermissionDeniedError("只有管理员可以创建技能")
        
        # 验证技能数据
        self._validate_skill_data(skill_data)
        
        # 检查技能名称是否已存在
        existing_skill = await self.skill_repo.get_by_name(skill_data.name)
        if existing_skill:
            raise ValidationError(f"技能 '{skill_data.name}' 已存在")
        
        # 创建技能
        skill = await self.skill_repo.create_skill(
            name=skill_data.name,
            description=skill_data.description,
            category=skill_data.category,
            tags=skill_data.tags or [],
            prerequisites=skill_data.prerequisites or [],
            learning_resources=skill_data.learning_resources or [],
            creator_id=creator_id
        )
        
        return skill

    async def get_skill(self, skill_id: str) -> Skill:
        """获取技能详情"""
        skill = await self.skill_repo.get_by_id(skill_id)
        if not skill:
            raise SkillNotFoundError(f"技能不存在: {skill_id}")
        
        return skill

    async def search_skills(
        self, 
        filters: SkillSearchFilters,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """搜索技能"""
        
        # 构建搜索条件
        search_conditions = self._build_search_conditions(filters)
        
        # 执行搜索
        skills, total = await self.skill_repo.search_skills(
            conditions=search_conditions,
            page=page,
            page_size=page_size
        )
        
        return {
            "skills": skills,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def add_user_skill(
        self, 
        user_id: str, 
        skill_data: UserSkillData
    ) -> UserSkill:
        """添加用户技能"""
        
        # 验证用户存在
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValidationError("用户不存在")
        
        # 验证技能存在
        skill = await self.skill_repo.get_by_id(skill_data.skill_id)
        if not skill:
            raise SkillNotFoundError(f"技能不存在: {skill_data.skill_id}")
        
        # 检查用户是否已有此技能
        existing_user_skill = await self.skill_repo.get_user_skill(
            user_id, skill_data.skill_id
        )
        if existing_user_skill:
            raise BusinessLogicError("用户已拥有此技能")
        
        # 验证技能数据
        self._validate_user_skill_data(skill_data)
        
        # 添加用户技能
        user_skill = await self.skill_repo.add_user_skill(
            user_id=user_id,
            skill_id=skill_data.skill_id,
            level=skill_data.level,
            experience_years=skill_data.experience_years,
            certifications=skill_data.certifications or [],
            projects=skill_data.projects or [],
            self_assessment=skill_data.self_assessment
        )
        
        return user_skill

    async def update_user_skill(
        self, 
        user_id: str, 
        skill_id: str,
        skill_data: UserSkillData,
        current_user_id: str
    ) -> UserSkill:
        """更新用户技能"""
        
        # 权限检查：只能更新自己的技能
        if user_id != current_user_id:
            current_user = await self.user_repo.get_by_id(current_user_id)
            if not current_user or current_user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限更新此用户的技能")
        
        # 验证用户技能存在
        user_skill = await self.skill_repo.get_user_skill(user_id, skill_id)
        if not user_skill:
            raise SkillNotFoundError("用户技能不存在")
        
        # 验证技能数据
        self._validate_user_skill_data(skill_data)
        
        # 更新用户技能
        updated_user_skill = await self.skill_repo.update_user_skill(
            user_id=user_id,
            skill_id=skill_id,
            level=skill_data.level,
            experience_years=skill_data.experience_years,
            certifications=skill_data.certifications or [],
            projects=skill_data.projects or [],
            self_assessment=skill_data.self_assessment
        )
        
        return updated_user_skill

    async def remove_user_skill(
        self, 
        user_id: str, 
        skill_id: str,
        current_user_id: str
    ) -> bool:
        """移除用户技能"""
        
        # 权限检查：只能移除自己的技能
        if user_id != current_user_id:
            current_user = await self.user_repo.get_by_id(current_user_id)
            if not current_user or current_user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限移除此用户的技能")
        
        # 验证用户技能存在
        user_skill = await self.skill_repo.get_user_skill(user_id, skill_id)
        if not user_skill:
            raise SkillNotFoundError("用户技能不存在")
        
        # 移除用户技能
        return await self.skill_repo.remove_user_skill(user_id, skill_id)

    async def get_user_skills(
        self, 
        user_id: str,
        category: Optional[SkillCategory] = None
    ) -> List[UserSkill]:
        """获取用户技能列表"""
        
        # 验证用户存在
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValidationError("用户不存在")
        
        # 获取用户技能
        user_skills = await self.skill_repo.get_user_skills(user_id, category)
        return user_skills

    async def assess_skill(
        self, 
        user_id: str,
        skill_id: str,
        assessor_id: str,
        score: int,
        feedback: Optional[str] = None,
        evidence_links: List[str] = None
    ) -> SkillAssessment:
        """技能评估"""
        
        # 验证评估者权限
        assessor = await self.user_repo.get_by_id(assessor_id)
        if not assessor:
            raise ValidationError("评估者不存在")
        
        # 验证用户技能存在
        user_skill = await self.skill_repo.get_user_skill(user_id, skill_id)
        if not user_skill:
            raise SkillNotFoundError("用户技能不存在")
        
        # 验证评估数据
        if not 1 <= score <= 100:
            raise ValidationError("评估分数必须在1-100之间")
        
        # 确定评估类型
        assessment_type = "self" if user_id == assessor_id else "peer"
        if assessor.user_type == UserType.ADMIN:
            assessment_type = "expert"
        
        # 根据分数确定技能等级
        level = self._score_to_level(score)
        
        # 创建评估记录
        assessment = await self.skill_repo.create_assessment(
            skill_id=skill_id,
            user_id=user_id,
            assessor_id=assessor_id,
            score=score,
            level=level,
            feedback=feedback,
            assessment_type=assessment_type,
            evidence_links=evidence_links or []
        )
        
        # 更新用户技能等级（如果是专家评估或自评）
        if assessment_type in ["expert", "self"]:
            await self.skill_repo.update_user_skill_level(user_id, skill_id, level)
        
        return assessment

    async def add_certification(
        self, 
        user_id: str,
        skill_id: str,
        certification_name: str,
        issuer: str,
        issue_date: datetime,
        expiry_date: Optional[datetime] = None,
        credential_id: Optional[str] = None,
        verification_url: Optional[str] = None
    ) -> SkillCertification:
        """添加技能认证"""
        
        # 验证用户技能存在
        user_skill = await self.skill_repo.get_user_skill(user_id, skill_id)
        if not user_skill:
            raise SkillNotFoundError("用户技能不存在")
        
        # 验证认证数据
        if not certification_name or len(certification_name.strip()) == 0:
            raise ValidationError("认证名称不能为空")
        
        if not issuer or len(issuer.strip()) == 0:
            raise ValidationError("颁发机构不能为空")
        
        if issue_date > datetime.utcnow():
            raise ValidationError("颁发日期不能是未来时间")
        
        if expiry_date and expiry_date <= issue_date:
            raise ValidationError("过期日期必须晚于颁发日期")
        
        # 创建认证记录
        certification = await self.skill_repo.add_certification(
            skill_id=skill_id,
            user_id=user_id,
            certification_name=certification_name,
            issuer=issuer,
            issue_date=issue_date,
            expiry_date=expiry_date,
            credential_id=credential_id,
            verification_url=verification_url
        )
        
        return certification

    async def get_user_certifications(
        self, 
        user_id: str,
        skill_id: Optional[str] = None
    ) -> List[SkillCertification]:
        """获取用户认证列表"""
        
        # 验证用户存在
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValidationError("用户不存在")
        
        # 获取认证列表
        certifications = await self.skill_repo.get_user_certifications(user_id, skill_id)
        return certifications

    async def get_skill_stats(self, user_id: Optional[str] = None) -> SkillStats:
        """获取技能统计"""
        stats = await self.skill_repo.get_skill_statistics(user_id)
        
        return SkillStats(
            total_skills=stats.get("total_skills", 0),
            user_skills_count=stats.get("user_skills_count", 0),
            certified_skills_count=stats.get("certified_skills_count", 0),
            skill_distribution=stats.get("skill_distribution", {}),
            level_distribution=stats.get("level_distribution", {}),
            top_skills=stats.get("top_skills", [])
        )

    async def get_skill_recommendations(
        self, 
        user_id: str,
        limit: int = 10
    ) -> List[Skill]:
        """获取技能推荐"""
        
        # 获取用户当前技能
        user_skills = await self.skill_repo.get_user_skills(user_id)
        user_skill_ids = [us.skill_id for us in user_skills]
        
        # 基于用户技能和行业趋势推荐新技能
        recommendations = await self.skill_repo.get_skill_recommendations(
            user_skill_ids=user_skill_ids,
            user_id=user_id,
            limit=limit
        )
        
        return recommendations

    async def get_learning_path(
        self, 
        target_skill_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """获取技能学习路径"""
        
        # 获取目标技能
        target_skill = await self.skill_repo.get_by_id(target_skill_id)
        if not target_skill:
            raise SkillNotFoundError(f"技能不存在: {target_skill_id}")
        
        # 获取用户当前技能
        user_skills = await self.skill_repo.get_user_skills(user_id)
        user_skill_ids = [us.skill_id for us in user_skills]
        
        # 生成学习路径
        learning_path = await self.skill_repo.generate_learning_path(
            target_skill_id=target_skill_id,
            user_skill_ids=user_skill_ids
        )
        
        return learning_path

    def _validate_skill_data(self, skill_data: SkillCreateData) -> None:
        """验证技能数据"""
        if not skill_data.name or len(skill_data.name.strip()) == 0:
            raise ValidationError("技能名称不能为空")
        
        if len(skill_data.name) > 100:
            raise ValidationError("技能名称不能超过100个字符")
        
        if not skill_data.description or len(skill_data.description.strip()) == 0:
            raise ValidationError("技能描述不能为空")
        
        if len(skill_data.description) > 1000:
            raise ValidationError("技能描述不能超过1000个字符")

    def _validate_user_skill_data(self, skill_data: UserSkillData) -> None:
        """验证用户技能数据"""
        if skill_data.experience_years is not None and skill_data.experience_years < 0:
            raise ValidationError("经验年限不能为负数")
        
        if (skill_data.self_assessment is not None and 
            not 1 <= skill_data.self_assessment <= 10):
            raise ValidationError("自评分数必须在1-10之间")

    def _score_to_level(self, score: int) -> SkillLevel:
        """根据分数确定技能等级"""
        if score >= 90:
            return SkillLevel.EXPERT
        elif score >= 75:
            return SkillLevel.ADVANCED
        elif score >= 60:
            return SkillLevel.INTERMEDIATE
        elif score >= 40:
            return SkillLevel.BEGINNER
        else:
            return SkillLevel.NOVICE

    def _build_search_conditions(self, filters: SkillSearchFilters) -> Dict[str, Any]:
        """构建搜索条件"""
        conditions = {}
        
        if filters.category:
            conditions["category"] = filters.category
        
        if filters.tags:
            conditions["tags"] = filters.tags
        
        if filters.search_text:
            conditions["search_text"] = filters.search_text
        
        if filters.user_id:
            conditions["user_id"] = filters.user_id
        
        if filters.min_level:
            conditions["min_level"] = filters.min_level
        
        if filters.has_certification is not None:
            conditions["has_certification"] = filters.has_certification
        
        return conditions