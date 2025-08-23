"""
任务管理API

提供任务管理相关的API接口，包括：
- 任务发布
- 任务查询
- 任务申请
- 任务管理
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from datetime import datetime

from services.auth_service import AuthService
from services.task_service import TaskService, TaskCreateData, TaskUpdateData, TaskSearchFilters
from services.user_service import UserService
from shared.container import get_auth_service, get_task_service, get_user_service
from shared.exceptions import ValidationError, AuthorizationError, ResourceNotFoundError
from database.models.task import TaskType, TaskPriority

router = APIRouter()
security = HTTPBearer()


# 请求模型
class CreateTaskRequest(BaseModel):
    """创建任务请求"""
    title: str = Field(..., min_length=5, max_length=200, description="任务标题")
    description: str = Field(..., min_length=20, description="任务描述")
    task_type: TaskType = Field(..., description="任务类型")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="任务优先级")
    budget_min: Optional[float] = Field(None, ge=0, description="最低预算")
    budget_max: Optional[float] = Field(None, ge=0, description="最高预算")
    required_skills: List[str] = Field(default=[], description="所需技能")
    deadline: Optional[datetime] = Field(None, description="截止时间")
    estimated_hours: Optional[int] = Field(None, ge=1, description="预估工时")
    attachments: List[str] = Field(default=[], description="附件")
    tags: List[str] = Field(default=[], description="标签")


class UpdateTaskRequest(BaseModel):
    """更新任务请求"""
    title: Optional[str] = Field(None, min_length=5, max_length=200, description="任务标题")
    description: Optional[str] = Field(None, min_length=20, description="任务描述")
    priority: Optional[TaskPriority] = Field(None, description="任务优先级")
    budget_min: Optional[float] = Field(None, ge=0, description="最低预算")
    budget_max: Optional[float] = Field(None, ge=0, description="最高预算")
    required_skills: Optional[List[str]] = Field(None, description="所需技能")
    deadline: Optional[datetime] = Field(None, description="截止时间")
    estimated_hours: Optional[int] = Field(None, ge=1, description="预估工时")
    attachments: Optional[List[str]] = Field(None, description="附件")
    tags: Optional[List[str]] = Field(None, description="标签")


class ApplyTaskRequest(BaseModel):
    """申请任务请求"""
    message: Optional[str] = Field(None, max_length=500, description="申请说明")
    estimated_hours: Optional[int] = Field(None, ge=1, description="预估工时")


# 响应模型
class TaskResponse(BaseModel):
    """任务响应"""
    id: str
    title: str
    description: str
    task_type: str
    priority: str
    status: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    required_skills: List[str]
    deadline: Optional[str]
    estimated_hours: Optional[int]
    attachments: List[str]
    tags: List[str]
    publisher_id: str
    publisher_username: str
    assignee_id: Optional[str]
    assignee_username: Optional[str]
    view_count: int
    application_count: int
    created_at: str
    updated_at: str


class TaskListResponse(BaseModel):
    """任务列表响应"""
    tasks: List[TaskResponse]
    total: int
    page: int
    size: int
    pages: int


class TaskApplicationResponse(BaseModel):
    """任务申请响应"""
    id: int
    task_id: int
    applicant_id: int
    applicant_username: str
    message: Optional[str]
    estimated_hours: Optional[int]
    status: str
    applied_at: str


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> int:
    """获取当前用户ID"""
    try:
        user_info = await auth_service.verify_access_token(credentials.credentials)
        return user_info["user_id"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌"
        )


@router.post(
    "/",
    response_model=TaskResponse,
    summary="创建任务",
    description="发布新的任务"
)
async def create_task(
    request: CreateTaskRequest,
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskResponse:
    """
    创建任务
    
    用户可以发布新的任务，供其他用户申请
    """
    try:
        # 构建任务创建数据
        task_data = TaskCreateData(
            title=request.title,
            description=request.description,
            task_type=request.task_type,
            priority=request.priority,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            required_skills=request.required_skills,
            deadline=request.deadline,
            estimated_hours=request.estimated_hours,
            attachments=request.attachments,
            tags=request.tags
        )
        
        # 创建任务
        task = await task_service.create_task(task_data, str(current_user_id))
        
        # 获取发布者用户名
        publisher = await user_service.get_user_by_id(str(current_user_id))
        publisher_username = publisher.username if publisher else ""
        
        # 构建响应
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type.value,
            priority=task.priority.value,
            status=task.status.value,
            budget_min=task.budget_min,
            budget_max=task.budget_max,
            required_skills=task.required_skills or [],
            deadline=task.deadline.isoformat() if task.deadline else None,
            estimated_hours=task.estimated_hours,
            attachments=task.attachments or [],
            tags=task.tags or [],
            publisher_id=task.publisher_id,
            publisher_username=publisher_username,
            assignee_id=task.assignee_id,
            assignee_username=None,
            view_count=task.view_count,
            application_count=task.application_count,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat()
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建任务失败"
        )


@router.get(
    "/",
    response_model=TaskListResponse,
    summary="获取任务列表",
    description="获取任务列表，支持筛选和分页"
)
async def get_tasks(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    task_type: Optional[str] = Query(None, description="任务类型"),
    priority: Optional[str] = Query(None, description="任务优先级"),
    status: Optional[str] = Query(None, description="任务状态"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skills: Optional[str] = Query(None, description="技能筛选（逗号分隔）"),
    min_budget: Optional[float] = Query(None, description="最低预算"),
    max_budget: Optional[float] = Query(None, description="最高预算"),
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskListResponse:
    """
    获取任务列表
    
    支持按类型、优先级、状态等条件筛选任务
    """
    try:
        # 构建搜索过滤条件
        filters = TaskSearchFilters(
            task_type=TaskType(task_type) if task_type else None,
            priority=TaskPriority(priority) if priority else None,
            status=status,
            search_text=search,
            skills=skills.split(",") if skills else None,
            min_budget=min_budget,
            max_budget=max_budget
        )
        
        # 搜索任务
        result = await task_service.search_tasks(filters, page, size)
        tasks = result["tasks"]
        total = result["total"]
        
        # 构建任务响应列表
        task_responses = []
        for task in tasks:
            # 获取发布者用户名
            publisher = await user_service.get_user_by_id(task.publisher_id)
            publisher_username = publisher.username if publisher else ""
            
            # 获取接受者用户名
            assignee_username = None
            if task.assignee_id:
                assignee = await user_service.get_user_by_id(task.assignee_id)
                assignee_username = assignee.username if assignee else ""
            
            task_responses.append(TaskResponse(
                id=task.id,
                title=task.title,
                description=task.description,
                task_type=task.task_type.value,
                priority=task.priority.value,
                status=task.status.value,
                budget_min=task.budget_min,
                budget_max=task.budget_max,
                required_skills=task.required_skills or [],
                deadline=task.deadline.isoformat() if task.deadline else None,
                estimated_hours=task.estimated_hours,
                attachments=task.attachments or [],
                tags=task.tags or [],
                publisher_id=task.publisher_id,
                publisher_username=publisher_username,
                assignee_id=task.assignee_id,
                assignee_username=assignee_username,
                view_count=task.view_count,
                application_count=task.application_count,
                created_at=task.created_at.isoformat(),
                updated_at=task.updated_at.isoformat()
            ))
        
        # 计算总页数
        pages = result["total_pages"]
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取任务列表失败"
        )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="获取任务详情",
    description="根据任务ID获取任务详细信息"
)
async def get_task(
    task_id: str,
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskResponse:
    """
    获取任务详情
    
    根据任务ID获取任务的详细信息
    """
    try:
        # 获取任务详情
        task = await task_service.get_task(task_id, str(current_user_id))
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="任务不存在"
            )
        
        # 获取发布者用户名
        publisher = await user_service.get_user_by_id(task.publisher_id)
        publisher_username = publisher.username if publisher else ""
        
        # 获取接受者用户名
        assignee_username = None
        if task.assignee_id:
            assignee = await user_service.get_user_by_id(task.assignee_id)
            assignee_username = assignee.username if assignee else ""
        
        # 构建响应
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type.value,
            priority=task.priority.value,
            status=task.status.value,
            budget_min=task.budget_min,
            budget_max=task.budget_max,
            required_skills=task.required_skills or [],
            deadline=task.deadline.isoformat() if task.deadline else None,
            estimated_hours=task.estimated_hours,
            attachments=task.attachments or [],
            tags=task.tags or [],
            publisher_id=task.publisher_id,
            publisher_username=publisher_username,
            assignee_id=task.assignee_id,
            assignee_username=assignee_username,
            view_count=task.view_count,
            application_count=task.application_count,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat()
        )
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取任务详情失败"
        )


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="更新任务",
    description="更新任务信息（仅任务发布者可操作）"
)
async def update_task(
    task_id: str,
    request: UpdateTaskRequest,
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskResponse:
    """
    更新任务
    
    任务发布者可以更新任务信息
    """
    try:
        # 构建更新数据
        update_data = TaskUpdateData(
            title=request.title,
            description=request.description,
            priority=request.priority,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            required_skills=request.required_skills,
            deadline=request.deadline,
            estimated_hours=request.estimated_hours,
            attachments=request.attachments,
            tags=request.tags
        )
        
        # 更新任务
        task = await task_service.update_task(task_id, update_data, str(current_user_id))
        
        # 获取发布者用户名
        publisher = await user_service.get_user_by_id(task.publisher_id)
        publisher_username = publisher.username if publisher else ""
        
        # 获取接受者用户名
        assignee_username = None
        if task.assignee_id:
            assignee = await user_service.get_user_by_id(task.assignee_id)
            assignee_username = assignee.username if assignee else ""
        
        # 构建响应
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type.value,
            priority=task.priority.value,
            status=task.status.value,
            budget_min=task.budget_min,
            budget_max=task.budget_max,
            required_skills=task.required_skills or [],
            deadline=task.deadline.isoformat() if task.deadline else None,
            estimated_hours=task.estimated_hours,
            attachments=task.attachments or [],
            tags=task.tags or [],
            publisher_id=task.publisher_id,
            publisher_username=publisher_username,
            assignee_id=task.assignee_id,
            assignee_username=assignee_username,
            view_count=task.view_count,
            application_count=task.application_count,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat()
        )
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限更新此任务"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新任务失败"
        )


@router.delete(
    "/{task_id}",
    summary="删除任务",
    description="删除任务（仅任务发布者可操作）"
)
async def delete_task(
    task_id: str,
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service)
) -> dict:
    """
    删除任务
    
    任务发布者可以删除自己发布的任务
    """
    try:
        # 删除任务
        success = await task_service.delete_task(task_id, str(current_user_id))
        
        if success:
            return {"message": "任务删除成功"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="任务删除失败"
            )
            
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此任务"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除任务失败"
        )


@router.post(
    "/{task_id}/apply",
    response_model=TaskApplicationResponse,
    summary="申请任务",
    description="申请参与任务"
)
async def apply_task(
    task_id: str,
    request: ApplyTaskRequest,
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskApplicationResponse:
    """
    申请任务
    
    用户可以申请参与感兴趣的任务
    """
    try:
        # 申请任务
        application = await task_service.apply_for_task(
            task_id=task_id,
            applicant_id=str(current_user_id),
            cover_letter=request.message or "",
            estimated_completion=None
        )
        
        # 获取申请者用户名
        applicant = await user_service.get_user_by_id(str(current_user_id))
        applicant_username = applicant.username if applicant else ""
        
        # 构建响应
        return TaskApplicationResponse(
            id=int(application.id),
            task_id=int(application.task_id),
            applicant_id=int(application.applicant_id),
            applicant_username=applicant_username,
            message=application.cover_letter,
            estimated_hours=request.estimated_hours,
            status=application.status,
            applied_at=application.applied_at.isoformat()
        )
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限申请此任务"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="申请任务失败"
        )


@router.get(
    "/{task_id}/applications",
    response_model=List[TaskApplicationResponse],
    summary="获取任务申请列表",
    description="获取任务的申请列表（仅任务发布者可查看）"
)
async def get_task_applications(
    task_id: str,
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> List[TaskApplicationResponse]:
    """
    获取任务申请列表
    
    任务发布者可以查看任务的所有申请
    """
    try:
        # 获取任务申请列表
        applications = await task_service.get_task_applications(
            task_id=task_id,
            requester_id=str(current_user_id)
        )
        
        # 构建响应列表
        response_list = []
        for application in applications:
            # 获取申请者用户名
            applicant = await user_service.get_user_by_id(application.applicant_id)
            applicant_username = applicant.username if applicant else ""
            
            response_list.append(TaskApplicationResponse(
                id=int(application.id),
                task_id=int(application.task_id),
                applicant_id=int(application.applicant_id),
                applicant_username=applicant_username,
                message=application.cover_letter,
                estimated_hours=None,  # 从申请数据中获取
                status=application.status,
                applied_at=application.applied_at.isoformat()
            ))
        
        return response_list
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限查看此任务的申请"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取任务申请列表失败"
        )


@router.put(
    "/{task_id}/applications/{application_id}/status",
    summary="处理任务申请",
    description="接受或拒绝任务申请（仅任务发布者可操作）"
)
async def handle_task_application(
    task_id: str,
    application_id: str,
    action: str = Query(..., regex="^(accept|reject)$", description="操作类型"),
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service)
) -> dict:
    """
    处理任务申请
    
    任务发布者可以接受或拒绝申请
    """
    try:
        if action == "accept":
            # 接受任务申请
            success = await task_service.accept_application(
                task_id=task_id,
                application_id=application_id,
                publisher_id=str(current_user_id)
            )
            message = "申请已接受"
        else:  # reject
            # 拒绝任务申请
            success = await task_service.reject_application(
                task_id=task_id,
                application_id=application_id,
                publisher_id=str(current_user_id)
            )
            message = "申请已拒绝"
        
        if success:
            return {"message": message}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="处理申请失败"
            )
            
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务或申请不存在"
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限处理此申请"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="处理申请失败"
        )


@router.get(
    "/my/published",
    response_model=TaskListResponse,
    summary="获取我发布的任务",
    description="获取当前用户发布的任务列表"
)
async def get_my_published_tasks(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="任务状态"),
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskListResponse:
    """
    获取我发布的任务
    
    获取当前用户发布的所有任务
    """
    try:
        # 构建搜索过滤条件
        filters = TaskSearchFilters(
            publisher_id=str(current_user_id),
            status=status
        )
        
        # 搜索任务
        result = await task_service.search_tasks(filters, page, size)
        tasks = result["tasks"]
        total = result["total"]
        
        # 构建任务响应列表
        task_responses = []
        for task in tasks:
            # 获取发布者用户名
            publisher = await user_service.get_user_by_id(task.publisher_id)
            publisher_username = publisher.username if publisher else ""
            
            # 获取接受者用户名
            assignee_username = None
            if task.assignee_id:
                assignee = await user_service.get_user_by_id(task.assignee_id)
                assignee_username = assignee.username if assignee else ""
            
            task_responses.append(TaskResponse(
                id=task.id,
                title=task.title,
                description=task.description,
                task_type=task.task_type.value,
                priority=task.priority.value,
                status=task.status.value,
                budget_min=task.budget_min,
                budget_max=task.budget_max,
                required_skills=task.required_skills or [],
                deadline=task.deadline.isoformat() if task.deadline else None,
                estimated_hours=task.estimated_hours,
                attachments=task.attachments or [],
                tags=task.tags or [],
                publisher_id=task.publisher_id,
                publisher_username=publisher_username,
                assignee_id=task.assignee_id,
                assignee_username=assignee_username,
                view_count=task.view_count,
                application_count=task.application_count,
                created_at=task.created_at.isoformat(),
                updated_at=task.updated_at.isoformat()
            ))
        
        # 计算总页数
        pages = result["total_pages"]
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取我发布的任务失败"
        )


@router.get(
    "/my/applied",
    response_model=TaskListResponse,
    summary="获取我申请的任务",
    description="获取当前用户申请的所有任务"
)
async def get_my_applied_tasks(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="申请状态"),
    current_user_id: int = Depends(get_current_user_id),
    task_service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service)
) -> TaskListResponse:
    """
    获取我申请的任务
    
    返回当前用户申请的所有任务
    """
    try:
        # 获取我申请的任务
        result = await task_service.get_user_applied_tasks(
            user_id=str(current_user_id),
            page=page,
            page_size=page_size,
            application_status=status
        )
        
        tasks = result["tasks"]
        total = result["total"]
        
        # 构建任务响应列表
        task_responses = []
        for task in tasks:
            # 获取发布者用户名
            publisher = await user_service.get_user_by_id(task.publisher_id)
            publisher_username = publisher.username if publisher else ""
            
            # 获取接受者用户名
            assignee_username = None
            if task.assignee_id:
                assignee = await user_service.get_user_by_id(task.assignee_id)
                assignee_username = assignee.username if assignee else ""
            
            task_responses.append(TaskResponse(
                id=task.id,
                title=task.title,
                description=task.description,
                task_type=task.task_type.value,
                priority=task.priority.value,
                status=task.status.value,
                budget_min=task.budget_min,
                budget_max=task.budget_max,
                required_skills=task.required_skills or [],
                deadline=task.deadline.isoformat() if task.deadline else None,
                estimated_hours=task.estimated_hours,
                attachments=task.attachments or [],
                tags=task.tags or [],
                publisher_id=task.publisher_id,
                publisher_username=publisher_username,
                assignee_id=task.assignee_id,
                assignee_username=assignee_username,
                view_count=task.view_count,
                application_count=task.application_count,
                created_at=task.created_at.isoformat(),
                updated_at=task.updated_at.isoformat()
            ))
        
        # 计算总页数
        pages = result["total_pages"]
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=page,
            size=page_size,
            pages=pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取我申请的任务失败"
        )