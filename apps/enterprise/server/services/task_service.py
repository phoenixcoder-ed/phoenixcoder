"""
任务服务
提供任务管理的核心业务逻辑
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import uuid

from repositories.task_repository import TaskRepository
from repositories.user_repository import UserRepository
from database.models.task import Task, TaskStatus, TaskPriority, TaskType
from database.models.user import UserType
from shared.exceptions import (
    TaskNotFoundError,
    ValidationError,
    PermissionDeniedError,
    BusinessLogicError
)


@dataclass
class TaskCreateData:
    """任务创建数据"""
    title: str
    description: str
    taskType: TaskType
    priority: TaskPriority
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None
    deadline: Optional[datetime] = None
    requiredSkills: List[str] = None
    estimatedHours: Optional[int] = None
    attachments: List[str] = None
    tags: List[str] = None


@dataclass
class TaskUpdateData:
    """任务更新数据"""
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    budgetMin: Optional[float] = None
    budgetMax: Optional[float] = None
    deadline: Optional[datetime] = None
    requiredSkills: Optional[List[str]] = None
    estimatedHours: Optional[int] = None
    attachments: Optional[List[str]] = None
    tags: Optional[List[str]] = None


@dataclass
class TaskSearchFilters:
    """任务搜索过滤器"""
    status: Optional[TaskStatus] = None
    taskType: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    minBudget: Optional[float] = None
    maxBudget: Optional[float] = None
    skills: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    deadlineBefore: Optional[datetime] = None
    deadlineAfter: Optional[datetime] = None
    searchText: Optional[str] = None
    employerId: Optional[str] = None
    assigneeId: Optional[str] = None


@dataclass
class TaskApplication:
    """任务申请"""
    id: str
    taskId: str
    applicantId: str
    applicantName: str
    applicantAvatar: Optional[str]
    coverLetter: str
    proposedBudget: Optional[float]
    estimatedCompletion: Optional[datetime]
    portfolioLinks: List[str]
    status: str
    appliedAt: datetime


@dataclass
class TaskStats:
    """任务统计"""
    totalTasks: int
    activeTasks: int
    completedTasks: int
    cancelledTasks: int
    tasksToday: int
    tasksThisWeek: int
    tasksThisMonth: int
    averageBudget: float
    totalBudget: float


class TaskService:
    """任务服务"""
    
    def __init__(
        self, 
        task_repository: TaskRepository,
        user_repository: UserRepository
    ):
        self.task_repo = task_repository
        self.user_repo = user_repository

    async def create_task(
        self, 
        task_data: TaskCreateData, 
        employer_id: str
    ) -> Task:
        """创建任务"""
        
        # 验证雇主权限
        employer = await self.user_repo.get_by_id(employer_id)
        if not employer:
            raise ValidationError("雇主不存在")
        
        if employer.user_type not in [UserType.EMPLOYER, UserType.ADMIN]:
            raise PermissionDeniedError("只有雇主可以发布任务")
        
        # 验证任务数据
        self._validate_task_data(task_data)
        
        # 创建任务
        task = await self.task_repo.create_task(
            title=task_data.title,
            description=task_data.description,
            task_type=task_data.taskType,
            priority=task_data.priority,
            budget_min=task_data.budgetMin,
            budget_max=task_data.budgetMax,
            deadline=task_data.deadline,
            required_skills=task_data.requiredSkills or [],
            estimated_hours=task_data.estimatedHours,
            attachments=task_data.attachments or [],
            tags=task_data.tags or [],
            employer_id=employer_id
        )
        
        return task

    async def get_task(self, task_id: str, user_id: Optional[str] = None) -> Task:
        """获取任务详情"""
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        # 检查访问权限（私有任务只有相关用户可以查看）
        if task.status == TaskStatus.DRAFT and task.employer_id != user_id:
            raise PermissionDeniedError("无权限查看此任务")
        
        return task

    async def update_task(
        self, 
        task_id: str, 
        update_data: TaskUpdateData,
        user_id: str
    ) -> Task:
        """更新任务"""
        
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        # 权限检查：只有任务发布者可以更新任务
        if task.employer_id != user_id:
            user = await self.user_repo.get_by_id(user_id)
            if not user or user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限更新此任务")
        
        # 检查任务状态：已完成或已取消的任务不能更新
        if task.status in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
            raise BusinessLogicError("已完成或已取消的任务不能更新")
        
        # 验证更新数据
        if update_data.title is not None:
            self._validate_title(update_data.title)
        if update_data.description is not None:
            self._validate_description(update_data.description)
        if update_data.budgetMin is not None or update_data.budgetMax is not None:
            self._validate_budget(update_data.budgetMin, update_data.budgetMax)
        
        # 更新任务
        updated_task = await self.task_repo.update_task(task_id, update_data.__dict__)
        return updated_task

    async def delete_task(self, task_id: str, user_id: str) -> bool:
        """删除任务"""
        
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        # 权限检查
        if task.employer_id != user_id:
            user = await self.user_repo.get_by_id(user_id)
            if not user or user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限删除此任务")
        
        # 检查任务状态：进行中的任务不能删除
        if task.status == TaskStatus.IN_PROGRESS:
            raise BusinessLogicError("进行中的任务不能删除")
        
        # 软删除任务
        return await self.task_repo.soft_delete_task(task_id)

    async def search_tasks(
        self, 
        filters: TaskSearchFilters,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """搜索任务"""
        
        # 构建搜索条件
        search_conditions = self._build_search_conditions(filters)
        
        # 执行搜索
        tasks, total = await self.task_repo.search_tasks(
            conditions=search_conditions,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return {
            "tasks": tasks,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def apply_for_task(
        self, 
        task_id: str, 
        applicant_id: str,
        cover_letter: str,
        proposed_budget: Optional[float] = None,
        estimated_completion: Optional[datetime] = None,
        portfolio_links: List[str] = None
    ) -> TaskApplication:
        """申请任务"""
        
        # 验证任务存在
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        # 验证申请者
        applicant = await self.user_repo.get_by_id(applicant_id)
        if not applicant:
            raise ValidationError("申请者不存在")
        
        if applicant.user_type not in [UserType.DEVELOPER, UserType.ADMIN]:
            raise PermissionDeniedError("只有开发者可以申请任务")
        
        # 检查任务状态
        if task.status != TaskStatus.OPEN:
            raise BusinessLogicError("只能申请开放状态的任务")
        
        # 检查是否已申请
        existing_application = await self.task_repo.get_application(task_id, applicant_id)
        if existing_application:
            raise BusinessLogicError("已经申请过此任务")
        
        # 验证申请数据
        if not cover_letter or len(cover_letter.strip()) == 0:
            raise ValidationError("求职信不能为空")
        
        if proposed_budget is not None and proposed_budget <= 0:
            raise ValidationError("报价必须大于0")
        
        # 创建申请
        application = await self.task_repo.create_application(
            task_id=task_id,
            applicant_id=applicant_id,
            cover_letter=cover_letter,
            proposed_budget=proposed_budget,
            estimated_completion=estimated_completion,
            portfolio_links=portfolio_links or []
        )
        
        return application

    async def get_task_applications(
        self, 
        task_id: str, 
        employer_id: str
    ) -> List[TaskApplication]:
        """获取任务申请列表"""
        
        # 验证任务存在和权限
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        if task.employer_id != employer_id:
            user = await self.user_repo.get_by_id(employer_id)
            if not user or user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限查看此任务的申请")
        
        # 获取申请列表
        applications = await self.task_repo.get_task_applications(task_id)
        return applications

    async def accept_application(
        self, 
        task_id: str, 
        application_id: str,
        employer_id: str
    ) -> bool:
        """接受申请"""
        
        # 验证任务和权限
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        if task.employer_id != employer_id:
            raise PermissionDeniedError("无权限操作此任务")
        
        if task.status != TaskStatus.OPEN:
            raise BusinessLogicError("只能接受开放状态任务的申请")
        
        # 验证申请存在
        application = await self.task_repo.get_application_by_id(application_id)
        if not application or application.task_id != task_id:
            raise ValidationError("申请不存在")
        
        # 接受申请并更新任务状态
        success = await self.task_repo.accept_application(
            application_id, 
            task_id,
            application.applicant_id
        )
        
        return success

    async def reject_application(
        self, 
        application_id: str,
        employer_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """拒绝申请"""
        
        # 验证申请存在
        application = await self.task_repo.get_application_by_id(application_id)
        if not application:
            raise ValidationError("申请不存在")
        
        # 验证权限
        task = await self.task_repo.get_by_id(application.task_id)
        if not task or task.employer_id != employer_id:
            raise PermissionDeniedError("无权限操作此申请")
        
        # 拒绝申请
        return await self.task_repo.reject_application(application_id, reason)

    async def complete_task(
        self, 
        task_id: str, 
        user_id: str,
        completion_notes: Optional[str] = None
    ) -> bool:
        """完成任务"""
        
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        # 权限检查：任务执行者或雇主可以标记完成
        if task.assignee_id != user_id and task.employer_id != user_id:
            raise PermissionDeniedError("无权限完成此任务")
        
        if task.status != TaskStatus.IN_PROGRESS:
            raise BusinessLogicError("只能完成进行中的任务")
        
        # 完成任务
        return await self.task_repo.complete_task(task_id, completion_notes)

    async def cancel_task(
        self, 
        task_id: str, 
        user_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """取消任务"""
        
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"任务不存在: {task_id}")
        
        # 权限检查：只有雇主可以取消任务
        if task.employer_id != user_id:
            user = await self.user_repo.get_by_id(user_id)
            if not user or user.user_type != UserType.ADMIN:
                raise PermissionDeniedError("无权限取消此任务")
        
        if task.status in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
            raise BusinessLogicError("已完成或已取消的任务不能再次取消")
        
        # 取消任务
        return await self.task_repo.cancel_task(task_id, reason)

    async def get_task_stats(self, user_id: Optional[str] = None) -> TaskStats:
        """获取任务统计"""
        stats = await self.task_repo.get_task_statistics(user_id)
        
        return TaskStats(
            totalTasks=stats.get("totalTasks", 0),
            activeTasks=stats.get("activeTasks", 0),
            completedTasks=stats.get("completedTasks", 0),
            cancelledTasks=stats.get("cancelledTasks", 0),
            tasksToday=stats.get("tasksToday", 0),
            tasksThisWeek=stats.get("tasksThisWeek", 0),
            tasksThisMonth=stats.get("tasksThisMonth", 0),
            averageBudget=stats.get("averageBudget", 0.0),
            totalBudget=stats.get("totalBudget", 0.0)
        )

    def _validate_task_data(self, task_data: TaskCreateData) -> None:
        """验证任务数据"""
        self._validate_title(task_data.title)
        self._validate_description(task_data.description)
        self._validate_budget(task_data.budgetMin, task_data.budgetMax)
        
        if task_data.deadline and task_data.deadline <= datetime.utcnow():
            raise ValidationError("截止时间必须是未来时间")
        
        if task_data.estimatedHours is not None and task_data.estimatedHours <= 0:
            raise ValidationError("预估工时必须大于0")

    def _validate_title(self, title: str) -> None:
        """验证标题"""
        if not title or len(title.strip()) == 0:
            raise ValidationError("任务标题不能为空")
        
        if len(title) > 200:
            raise ValidationError("任务标题不能超过200个字符")

    def _validate_description(self, description: str) -> None:
        """验证描述"""
        if not description or len(description.strip()) == 0:
            raise ValidationError("任务描述不能为空")
        
        if len(description) > 5000:
            raise ValidationError("任务描述不能超过5000个字符")

    def _validate_budget(
        self, 
        budgetMin: Optional[float], 
        budgetMax: Optional[float]
    ) -> None:
        """验证预算"""
        if budgetMin is not None and budgetMin < 0:
            raise ValidationError("最低预算不能为负数")
        
        if budgetMax is not None and budgetMax < 0:
            raise ValidationError("最高预算不能为负数")
        
        if (budgetMin is not None and budgetMax is not None and 
            budgetMin > budgetMax):
            raise ValidationError("最低预算不能高于最高预算")

    def _build_search_conditions(self, filters: TaskSearchFilters) -> Dict[str, Any]:
        """构建搜索条件"""
        conditions = {}
        
        if filters.status:
            conditions["status"] = filters.status
        
        if filters.taskType:
            conditions["taskType"] = filters.taskType
        
        if filters.priority:
            conditions["priority"] = filters.priority
        
        if filters.minBudget is not None:
            conditions["minBudget"] = filters.minBudget
        
        if filters.maxBudget is not None:
            conditions["maxBudget"] = filters.maxBudget
        
        if filters.skills:
            conditions["skills"] = filters.skills
        
        if filters.tags:
            conditions["tags"] = filters.tags
        
        if filters.deadlineBefore:
            conditions["deadlineBefore"] = filters.deadlineBefore
        
        if filters.deadlineAfter:
            conditions["deadlineAfter"] = filters.deadlineAfter
        
        if filters.searchText:
            conditions["searchText"] = filters.searchText
        
        if filters.employerId:
            conditions["employerId"] = filters.employerId
        
        if filters.assigneeId:
            conditions["assigneeId"] = filters.assigneeId
        
        return conditions