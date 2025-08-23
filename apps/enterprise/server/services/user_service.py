"""
用户服务
提供用户管理的核心业务逻辑
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import uuid

from repositories.user_repository import UserRepository
from database.models.user import User, UserType, UserStatus
from shared.exceptions import (
    UserNotFoundError,
    ValidationError,
    PermissionDeniedError,
    UserAlreadyExistsError
)


@dataclass
class UserProfile:
    """用户档案"""
    id: str
    sub: str
    email: Optional[str]
    phone: Optional[str]
    username: Optional[str]
    name: str
    avatarUrl: Optional[str]
    userType: UserType
    status: UserStatus
    bio: Optional[str]
    location: Optional[str]
    website: Optional[str]
    githubUrl: Optional[str]
    linkedinUrl: Optional[str]
    skills: List[str]
    experienceYears: Optional[int]
    hourlyRate: Optional[float]
    createdAt: datetime
    updatedAt: datetime
    lastLoginAt: Optional[datetime]


@dataclass
class UserUpdateData:
    """用户更新数据"""
    name: Optional[str] = None
    avatarUrl: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    experienceYears: Optional[int] = None
    hourlyRate: Optional[float] = None


@dataclass
class UserSearchFilters:
    """用户搜索过滤器"""
    userType: Optional[UserType] = None
    status: Optional[UserStatus] = None
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    minExperience: Optional[int] = None
    maxExperience: Optional[int] = None
    minHourlyRate: Optional[float] = None
    maxHourlyRate: Optional[float] = None
    searchText: Optional[str] = None


@dataclass
class UserStats:
    """用户统计"""
    totalUsers: int
    activeUsers: int
    developers: int
    employers: int
    newUsersToday: int
    newUsersThisWeek: int
    newUsersThisMonth: int


class UserService:
    """用户服务"""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repo = user_repository

    async def get_user_profile(self, user_id: str) -> UserProfile:
        """获取用户档案"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"用户不存在: {user_id}")
        
        return self._user_to_profile(user)

    async def get_user_by_sub(self, sub: str) -> UserProfile:
        """通过sub获取用户档案"""
        user = await self.user_repo.get_by_sub(sub)
        if not user:
            raise UserNotFoundError(f"用户不存在: {sub}")
        
        return self._user_to_profile(user)

    async def update_user_profile(
        self, 
        user_id: str, 
        update_data: UserUpdateData,
        current_user_id: str
    ) -> UserProfile:
        """更新用户档案"""
        
        # 权限检查：只能更新自己的档案或管理员可以更新任何档案
        if user_id != current_user_id:
            current_user = await self.user_repo.get_by_id(current_user_id)
            if not current_user or current_user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限更新此用户档案")
        
        # 验证数据
        self._validate_update_data(update_data)
        
        # 更新用户
        updated_user = await self.user_repo.update_user(user_id, update_data.__dict__)
        if not updated_user:
            raise UserNotFoundError(f"用户不存在: {user_id}")
        
        return self._user_to_profile(updated_user)

    async def search_users(
        self, 
        filters: UserSearchFilters,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """搜索用户"""
        
        # 构建搜索条件
        search_conditions = self._build_search_conditions(filters)
        
        # 执行搜索
        users, total = await self.user_repo.search_users(
            conditions=search_conditions,
            page=page,
            page_size=page_size
        )
        
        # 转换为档案格式
        profiles = [self._user_to_profile(user) for user in users]
        
        return {
            "users": profiles,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def get_user_stats(self) -> UserStats:
        """获取用户统计"""
        stats = await self.user_repo.get_user_statistics()
        
        return UserStats(
            totalUsers=stats.get("totalUsers", 0),
            activeUsers=stats.get("activeUsers", 0),
            developers=stats.get("developers", 0),
            employers=stats.get("employers", 0),
            newUsersToday=stats.get("newUsersToday", 0),
            newUsersThisWeek=stats.get("newUsersThisWeek", 0),
            newUsersThisMonth=stats.get("newUsersThisMonth", 0)
        )

    async def deactivate_user(
        self, 
        user_id: str, 
        current_user_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """停用用户"""
        
        # 权限检查：只有管理员可以停用用户
        current_user = await self.user_repo.get_by_id(current_user_id)
        if not current_user or current_user.user_type != UserType.ADMIN:
            raise PermissionDeniedError("无权限停用用户")
        
        # 不能停用自己
        if user_id == current_user_id:
            raise ValidationError("不能停用自己的账户")
        
        # 停用用户
        success = await self.user_repo.update_user_status(
            user_id, 
            UserStatus.INACTIVE,
            reason
        )
        
        if not success:
            raise UserNotFoundError(f"用户不存在: {user_id}")
        
        return True

    async def activate_user(
        self, 
        user_id: str, 
        current_user_id: str
    ) -> bool:
        """激活用户"""
        
        # 权限检查：只有管理员可以激活用户
        current_user = await self.user_repo.get_by_id(current_user_id)
        if not current_user or current_user.user_type != UserType.ADMIN:
            raise PermissionDeniedError("无权限激活用户")
        
        # 激活用户
        success = await self.user_repo.update_user_status(
            user_id, 
            UserStatus.ACTIVE
        )
        
        if not success:
            raise UserNotFoundError(f"用户不存在: {user_id}")
        
        return True

    async def delete_user(
        self, 
        user_id: str, 
        current_user_id: str
    ) -> bool:
        """删除用户（软删除）"""
        
        # 权限检查：只有管理员可以删除用户，或用户可以删除自己
        current_user = await self.user_repo.get_by_id(current_user_id)
        if not current_user:
            raise PermissionDeniedError("无权限删除用户")
        
        if user_id != current_user_id and current_user.user_type != UserType.ADMIN:
            raise PermissionDeniedError("无权限删除此用户")
        
        # 执行软删除
        success = await self.user_repo.soft_delete_user(user_id)
        
        if not success:
            raise UserNotFoundError(f"用户不存在: {user_id}")
        
        return True

    async def check_username_availability(self, username: str) -> bool:
        """检查用户名是否可用"""
        if not username or len(username) < 3:
            return False
        
        user = await self.user_repo.get_by_username(username)
        return user is None

    async def check_email_availability(self, email: str) -> bool:
        """检查邮箱是否可用"""
        if not email or "@" not in email:
            return False
        
        user = await self.user_repo.get_by_email(email)
        return user is None

    async def get_user_activity_summary(self, user_id: str) -> Dict[str, Any]:
        """获取用户活动摘要"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"用户不存在: {user_id}")
        
        # 这里应该从其他服务获取活动数据
        # 暂时返回模拟数据
        return {
            "tasksCompleted": 15,
            "tasksInProgress": 3,
            "totalEarnings": 5000.0,
            "averageRating": 4.8,
            "skillsCount": 8,
            "certificationsCount": 3,
            "lastActivity": datetime.utcnow() - timedelta(hours=2)
        }

    def _user_to_profile(self, user: User) -> UserProfile:
        """将用户模型转换为用户档案"""
        return UserProfile(
            id=str(user.id),
            sub=user.sub,
            email=user.email,
            phone=user.phone,
            username=user.username,
            name=user.name,
            avatarUrl=user.avatarUrl,
            userType=user.userType,
            status=user.status,
            bio=user.bio,
            location=user.location,
            website=user.website,
            githubUrl=user.githubUrl,
            linkedinUrl=user.linkedinUrl,
            skills=user.skills or [],
            experienceYears=user.experienceYears,
            hourlyRate=user.hourlyRate,
            createdAt=user.createdAt,
            updatedAt=user.updatedAt,
            lastLoginAt=user.lastLoginAt
        )

    def _validate_update_data(self, update_data: UserUpdateData) -> None:
        """验证更新数据"""
        if update_data.name is not None and len(update_data.name.strip()) == 0:
            raise ValidationError("姓名不能为空")
        
        if update_data.website and not self._is_valid_url(update_data.website):
            raise ValidationError("网站URL格式不正确")
        
        if update_data.githubUrl and not self._is_valid_url(update_data.githubUrl):
            raise ValidationError("GitHub URL格式不正确")
        
        if update_data.linkedinUrl and not self._is_valid_url(update_data.linkedinUrl):
            raise ValidationError("LinkedIn URL格式不正确")
        
        if update_data.experienceYears is not None and update_data.experienceYears < 0:
            raise ValidationError("工作经验年限不能为负数")
        
        if update_data.hourlyRate is not None and update_data.hourlyRate < 0:
            raise ValidationError("时薪不能为负数")

    def _is_valid_url(self, url: str) -> bool:
        """验证URL格式"""
        import re
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return url_pattern.match(url) is not None

    def _build_search_conditions(self, filters: UserSearchFilters) -> Dict[str, Any]:
        """构建搜索条件"""
        conditions = {}
        
        if filters.userType:
            conditions["userType"] = filters.userType
        
        if filters.status:
            conditions["status"] = filters.status
        
        if filters.skills:
            conditions["skills"] = filters.skills
        
        if filters.location:
            conditions["location"] = filters.location
        
        if filters.minExperience is not None:
            conditions["minExperience"] = filters.minExperience
        
        if filters.maxExperience is not None:
            conditions["maxExperience"] = filters.maxExperience
        
        if filters.minHourlyRate is not None:
            conditions["minHourlyRate"] = filters.minHourlyRate
        
        if filters.maxHourlyRate is not None:
            conditions["maxHourlyRate"] = filters.maxHourlyRate
        
        if filters.searchText:
            conditions["searchText"] = filters.searchText
        
        return conditions