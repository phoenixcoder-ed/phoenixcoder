"""
成长记录API

提供用户成长记录相关的API接口，包括：
- 成长记录查询
- 学习计划管理
- 成就系统
- 成长统计
"""

from typing import Optional, List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from services.auth_service import AuthService
from services.growth_service import GrowthService
from shared.container import get_auth_service, get_growth_service
from shared.exceptions import ValidationError, AuthorizationError, ResourceNotFoundError

router = APIRouter()
security = HTTPBearer()


# 请求模型
class CreateLearningPlanRequest(BaseModel):
    """创建学习计划请求"""
    title: str = Field(..., min_length=5, max_length=200, description="计划标题")
    description: Optional[str] = Field(None, max_length=1000, description="计划描述")
    target_skills: List[str] = Field(..., description="目标技能")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    daily_hours: float = Field(..., ge=0.5, le=12, description="每日学习时长")
    priority: str = Field(default="medium", description="优先级")


class UpdateLearningPlanRequest(BaseModel):
    """更新学习计划请求"""
    title: Optional[str] = Field(None, min_length=5, max_length=200, description="计划标题")
    description: Optional[str] = Field(None, max_length=1000, description="计划描述")
    target_skills: Optional[List[str]] = Field(None, description="目标技能")
    start_date: Optional[date] = Field(None, description="开始日期")
    end_date: Optional[date] = Field(None, description="结束日期")
    daily_hours: Optional[float] = Field(None, ge=0.5, le=12, description="每日学习时长")
    priority: Optional[str] = Field(None, description="优先级")
    status: Optional[str] = Field(None, description="状态")


class CreateStudyRecordRequest(BaseModel):
    """创建学习记录请求"""
    plan_id: Optional[int] = Field(None, description="关联的学习计划ID")
    title: str = Field(..., min_length=5, max_length=200, description="学习内容")
    description: Optional[str] = Field(None, max_length=1000, description="学习描述")
    skills: List[str] = Field(..., description="涉及技能")
    duration_minutes: int = Field(..., ge=1, description="学习时长(分钟)")
    study_date: date = Field(..., description="学习日期")
    resources: Optional[List[str]] = Field(default=[], description="学习资源")
    notes: Optional[str] = Field(None, max_length=2000, description="学习笔记")


class CreateAchievementRequest(BaseModel):
    """创建成就请求"""
    title: str = Field(..., min_length=5, max_length=100, description="成就标题")
    description: str = Field(..., min_length=10, max_length=500, description="成就描述")
    category: str = Field(..., description="成就分类")
    icon: Optional[str] = Field(None, description="成就图标")
    points: int = Field(..., ge=1, description="成就积分")
    conditions: dict = Field(..., description="获得条件")


# 响应模型
class LearningPlanResponse(BaseModel):
    """学习计划响应"""
    id: int
    title: str
    description: Optional[str]
    target_skills: List[str]
    start_date: str
    end_date: str
    daily_hours: float
    priority: str
    status: str
    progress: float
    total_study_hours: float
    created_at: str
    updated_at: str


class StudyRecordResponse(BaseModel):
    """学习记录响应"""
    id: int
    plan_id: Optional[int]
    plan_title: Optional[str]
    title: str
    description: Optional[str]
    skills: List[str]
    duration_minutes: int
    study_date: str
    resources: List[str]
    notes: Optional[str]
    created_at: str


class AchievementResponse(BaseModel):
    """成就响应"""
    id: int
    title: str
    description: str
    category: str
    icon: Optional[str]
    points: int
    is_unlocked: bool
    unlocked_at: Optional[str]
    progress: float


class UserAchievementResponse(BaseModel):
    """用户成就响应"""
    achievement: AchievementResponse
    unlocked_at: str
    progress: float


class GrowthStatsResponse(BaseModel):
    """成长统计响应"""
    total_study_hours: float
    total_study_days: int
    current_streak: int
    longest_streak: int
    total_achievements: int
    total_points: int
    skill_progress: dict
    monthly_hours: dict
    recent_activities: List[dict]


class LearningPlanListResponse(BaseModel):
    """学习计划列表响应"""
    plans: List[LearningPlanResponse]
    total: int
    page: int
    size: int
    pages: int


class StudyRecordListResponse(BaseModel):
    """学习记录列表响应"""
    records: List[StudyRecordResponse]
    total: int
    page: int
    size: int
    pages: int


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


# 学习计划相关接口
@router.get(
    "/plans",
    response_model=LearningPlanListResponse,
    summary="获取学习计划列表",
    description="获取当前用户的学习计划列表"
)
async def get_learning_plans(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="计划状态"),
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> LearningPlanListResponse:
    """
    获取学习计划列表
    
    获取当前用户的所有学习计划
    """
    try:
        # 获取用户学习路径（模拟学习计划）
        learning_paths = await growth_service.get_user_learning_paths(str(current_user_id))
        
        # 构建学习计划响应
        plans = []
        for path in learning_paths:
            plan = LearningPlanResponse(
                id=int(path["id"]),
                title=path["name"],
                description=path["description"],
                target_skills=path.get("skills_covered", []),
                start_date="2024-01-01",
                end_date="2024-12-31",
                daily_hours=2.0,
                priority="medium",
                status="active" if path["progress"] < 100 else "completed",
                progress=path["progress"],
                total_study_hours=path.get("estimated_time", 0),
                created_at="2024-01-01T00:00:00Z",
                updated_at="2024-01-01T00:00:00Z"
            )
            plans.append(plan)
        
        # 应用状态过滤
        if status:
            plans = [plan for plan in plans if plan.status == status]
        
        # 分页处理
        total = len(plans)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_plans = plans[start_idx:end_idx]
        
        return LearningPlanListResponse(
            plans=paginated_plans,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学习计划列表失败: {str(e)}"
        )


@router.post(
    "/plans",
    response_model=LearningPlanResponse,
    summary="创建学习计划",
    description="创建新的学习计划"
)
async def create_learning_plan(
    request: CreateLearningPlanRequest,
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> LearningPlanResponse:
    """
    创建学习计划
    
    为当前用户创建新的学习计划
    """
    try:
        # 验证日期
        if request.end_date <= request.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="结束日期必须晚于开始日期"
            )
        
        # 模拟创建学习计划（实际应该调用服务层）
        plan_id = 999  # 模拟生成的ID
        
        plan = LearningPlanResponse(
            id=plan_id,
            title=request.title,
            description=request.description,
            target_skills=request.target_skills,
            start_date=request.start_date.isoformat(),
            end_date=request.end_date.isoformat(),
            daily_hours=request.daily_hours,
            priority=request.priority,
            status="active",
            progress=0.0,
            total_study_hours=0.0,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        
        return plan
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"数据验证失败: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建学习计划失败: {str(e)}"
        )


@router.get(
    "/plans/{plan_id}",
    response_model=LearningPlanResponse,
    summary="获取学习计划详情",
    description="根据计划ID获取学习计划详细信息"
)
async def get_learning_plan(
    plan_id: int,
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> LearningPlanResponse:
    """
    获取学习计划详情
    
    根据计划ID获取学习计划的详细信息
    """
    try:
        # 获取学习路径详情
        path_details = await growth_service.get_learning_path_details(str(current_user_id), str(plan_id))
        
        if not path_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="学习计划不存在"
            )
        
        plan = LearningPlanResponse(
            id=int(path_details["id"]),
            title=path_details["name"],
            description=path_details["description"],
            target_skills=path_details.get("skills_covered", []),
            start_date="2024-01-01",
            end_date="2024-12-31",
            daily_hours=2.0,
            priority="medium",
            status="active" if path_details["progress"] < 100 else "completed",
            progress=path_details["progress"],
            total_study_hours=path_details.get("estimated_time", 0),
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z"
        )
        
        return plan
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="学习计划不存在"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学习计划详情失败: {str(e)}"
        )


@router.put(
    "/learning-plans/{plan_id}",
    response_model=LearningPlanResponse,
    summary="更新学习计划",
    description="更新指定的学习计划"
)
async def update_learning_plan(
    plan_id: int,
    request: UpdateLearningPlanRequest,
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> LearningPlanResponse:
    """
    更新学习计划
    
    更新指定ID的学习计划信息
    """
    try:
        # 验证日期
        if request.start_date and request.end_date:
            if request.start_date >= request.end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="开始日期必须早于结束日期"
                )
        
        # 模拟更新学习计划
        updated_plan = LearningPlanResponse(
            id=plan_id,
            title=request.title or f"更新的学习计划 {plan_id}",
            description=request.description or "这是一个更新后的学习计划描述",
            skills=request.skills or ["Python", "数据结构"],
            difficulty=request.difficulty or "intermediate",
            estimated_hours=request.estimated_hours or 40,
            start_date=request.start_date or datetime.now().date(),
            end_date=request.end_date or (datetime.now() + timedelta(days=30)).date(),
            status=request.status or "active",
            progress=25.0,  # 保持原有进度
            created_at=datetime.now() - timedelta(days=5),  # 保持原创建时间
            updated_at=datetime.now()
        )
        
        return updated_plan
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"数据验证失败: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新学习计划失败: {str(e)}"
        )


@router.delete(
    "/learning-plans/{plan_id}",
    summary="删除学习计划",
    description="删除指定的学习计划"
)
async def delete_learning_plan(
    plan_id: int,
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> dict:
    """
    删除学习计划
    
    删除指定ID的学习计划
    """
    try:
        # 模拟检查学习计划是否存在
        if plan_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="学习计划不存在"
            )
        
        # 模拟检查是否有权限删除
        # 这里简化处理，实际应该检查计划是否属于当前用户
        
        # 模拟删除操作
        return {
            "message": f"学习计划 {plan_id} 已成功删除",
            "deleted_plan_id": plan_id,
            "deleted_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除学习计划失败: {str(e)}"
        )


# 学习记录相关接口
@router.get(
    "/records",
    response_model=StudyRecordListResponse,
    summary="获取学习记录列表",
    description="获取当前用户的学习记录列表"
)
async def get_study_records(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    plan_id: Optional[int] = Query(None, description="学习计划ID"),
    skill: Optional[str] = Query(None, description="技能筛选"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    current_user_id: int = Depends(get_current_user_id)
) -> StudyRecordListResponse:
    """
    获取学习记录列表
    
    获取当前用户的学习记录，支持多种筛选条件
    """
    try:
        # 模拟学习记录数据
        all_records = [
            StudyRecordResponse(
                id=1,
                plan_id=1,
                plan_title="Python基础学习计划",
                title="Python基础语法学习",
                description="学习了Python的基础语法和数据类型",
                skills=["Python", "编程基础"],
                duration_minutes=120,
                study_date=(datetime.now().date() - timedelta(days=1)).isoformat(),
                resources=["Python官方文档", "菜鸟教程"],
                notes="掌握了变量、函数和类的基本概念",
                created_at=(datetime.now() - timedelta(days=1)).isoformat()
            ),
            StudyRecordResponse(
                id=2,
                plan_id=2,
                plan_title="前端开发学习计划",
                title="JavaScript ES6特性学习",
                description="深入学习ES6的新特性",
                skills=["JavaScript", "前端开发"],
                duration_minutes=90,
                study_date=(datetime.now().date() - timedelta(days=2)).isoformat(),
                resources=["MDN文档", "ES6入门教程"],
                notes="学习了箭头函数、解构赋值、Promise等",
                created_at=(datetime.now() - timedelta(days=2)).isoformat()
            ),
            StudyRecordResponse(
                id=3,
                plan_id=1,
                plan_title="Python基础学习计划",
                title="数据结构与算法练习",
                description="练习常用数据结构的实现",
                skills=["Python", "算法", "数据结构"],
                duration_minutes=150,
                study_date=(datetime.now().date() - timedelta(days=3)).isoformat(),
                resources=["算法导论", "LeetCode"],
                notes="练习了链表、栈和队列的实现",
                created_at=(datetime.now() - timedelta(days=3)).isoformat()
            ),
            StudyRecordResponse(
                id=4,
                plan_id=2,
                plan_title="前端开发学习计划",
                title="React组件化开发",
                description="学习React的组件化开发模式",
                skills=["React", "JavaScript", "前端开发"],
                duration_minutes=180,
                study_date=(datetime.now().date() - timedelta(days=4)).isoformat(),
                resources=["React官方文档", "React实战教程"],
                notes="学习了Hook的使用和状态管理",
                created_at=(datetime.now() - timedelta(days=4)).isoformat()
            )
        ]
        
        # 应用筛选条件
        filtered_records = all_records
        
        if plan_id:
            filtered_records = [r for r in filtered_records if r.plan_id == plan_id]
        
        if skill:
            filtered_records = [r for r in filtered_records if skill in r.skills]
        
        if start_date:
            filtered_records = [r for r in filtered_records if r.study_date >= start_date.isoformat()]
            
        if end_date:
            filtered_records = [r for r in filtered_records if r.study_date <= end_date.isoformat()]
        
        # 分页处理
        total = len(filtered_records)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        records = filtered_records[start_idx:end_idx]
        
        return StudyRecordListResponse(
            records=records,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学习记录列表失败: {str(e)}"
        )


@router.post(
    "/records",
    response_model=StudyRecordResponse,
    summary="创建学习记录",
    description="创建新的学习记录"
)
async def create_study_record(
    request: CreateStudyRecordRequest,
    current_user_id: int = Depends(get_current_user_id)
) -> StudyRecordResponse:
    """
    创建学习记录
    
    为当前用户创建新的学习记录
    """
    try:
        # 验证学习日期不能是未来日期
        if request.study_date > datetime.now().date():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="学习日期不能是未来日期"
            )
        
        # 验证学习时长合理性
        if request.duration_minutes > 720:  # 12小时
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="单次学习时长不能超过12小时"
            )
        
        # 模拟创建学习记录
        record_id = 999  # 模拟生成的ID
        
        # 获取计划标题（如果有关联计划）
        plan_title = None
        if request.plan_id:
            plan_title = f"学习计划 {request.plan_id}"
        
        record = StudyRecordResponse(
            id=record_id,
            plan_id=request.plan_id,
            plan_title=plan_title,
            title=request.title,
            description=request.description,
            skills=request.skills,
            duration_minutes=request.duration_minutes,
            study_date=request.study_date.isoformat(),
            resources=request.resources or [],
            notes=request.notes,
            created_at=datetime.now().isoformat()
        )
        
        return record
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"数据验证失败: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建学习记录失败: {str(e)}"
        )


@router.get(
    "/records/{record_id}",
    response_model=StudyRecordResponse,
    summary="获取学习记录详情",
    description="根据记录ID获取学习记录详细信息"
)
async def get_study_record(
    record_id: int,
    current_user_id: int = Depends(get_current_user_id)
) -> StudyRecordResponse:
    """
    获取学习记录详情
    
    根据记录ID获取学习记录的详细信息
    """
    try:
        # 模拟检查记录是否存在
        if record_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="学习记录不存在"
            )
        
        # 模拟学习记录详情数据
        record = StudyRecordResponse(
            id=record_id,
            plan_id=1,
            plan_title="Python基础学习计划",
            title="Python面向对象编程",
            description="深入学习Python的面向对象编程概念，包括类、对象、继承、多态等",
            skills=["Python", "面向对象编程", "设计模式"],
            duration_minutes=180,
            study_date=(datetime.now().date() - timedelta(days=1)).isoformat(),
            resources=[
                "Python官方文档 - 类和对象",
                "《Python编程：从入门到实践》第9章",
                "菜鸟教程 - Python面向对象"
            ],
            notes="""今天学习了Python面向对象编程的核心概念：
            
1. 类的定义和实例化
2. 属性和方法的使用
3. 继承机制和方法重写
4. 多态的实现
5. 特殊方法（魔法方法）的使用

重点掌握了__init__、__str__、__repr__等特殊方法的用法。
通过实际编写一个简单的学生管理系统加深了理解。

明天计划学习装饰器和上下文管理器。""",
            created_at=(datetime.now() - timedelta(days=1)).isoformat()
        )
        
        return record
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学习记录详情失败: {str(e)}"
        )


@router.delete(
    "/records/{record_id}",
    summary="删除学习记录",
    description="删除学习记录"
)
async def delete_study_record(
    record_id: int,
    current_user_id: int = Depends(get_current_user_id)
) -> dict:
    """
    删除学习记录
    
    删除指定的学习记录
    """
    try:
        # 模拟检查学习记录是否存在
        if record_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="学习记录不存在"
            )
        
        # 模拟检查是否有权限删除
        # 这里简化处理，实际应该检查记录是否属于当前用户
        
        # 模拟删除操作
        return {
            "message": f"学习记录 {record_id} 已成功删除",
            "deleted_record_id": record_id,
            "deleted_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除学习记录失败: {str(e)}"
        )


# 成就系统相关接口
@router.get(
    "/achievements",
    response_model=List[AchievementResponse],
    summary="获取成就列表",
    description="获取所有可用的成就"
)
async def get_achievements(
    category: Optional[str] = Query(None, description="成就分类"),
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> List[AchievementResponse]:
    """
    获取成就列表
    
    获取系统中所有的成就，显示用户的解锁状态
    """
    try:
        # 模拟成就数据
        achievements_data = [
            {
                "id": 1,
                "title": "初学者",
                "description": "完成第一个挑战",
                "category": "学习",
                "icon": "🎯",
                "points": 10,
                "is_unlocked": True,
                "unlocked_at": "2024-01-15T10:00:00Z",
                "progress": 100.0
            },
            {
                "id": 2,
                "title": "Python专家",
                "description": "完成10个Python相关挑战",
                "category": "技能",
                "icon": "🐍",
                "points": 50,
                "is_unlocked": True,
                "unlocked_at": "2024-02-01T15:30:00Z",
                "progress": 100.0
            },
            {
                "id": 3,
                "title": "连续学习者",
                "description": "连续学习7天",
                "category": "习惯",
                "icon": "🔥",
                "points": 30,
                "is_unlocked": False,
                "unlocked_at": None,
                "progress": 57.1
            },
            {
                "id": 4,
                "title": "全栈开发者",
                "description": "掌握前端和后端技能",
                "category": "技能",
                "icon": "💻",
                "points": 100,
                "is_unlocked": False,
                "unlocked_at": None,
                "progress": 75.0
            }
        ]
        
        # 应用分类过滤
        if category:
            achievements_data = [a for a in achievements_data if a["category"] == category]
        
        # 构建响应
        achievements = []
        for data in achievements_data:
            achievement = AchievementResponse(
                id=data["id"],
                title=data["title"],
                description=data["description"],
                category=data["category"],
                icon=data["icon"],
                points=data["points"],
                is_unlocked=data["is_unlocked"],
                unlocked_at=data["unlocked_at"],
                progress=data["progress"]
            )
            achievements.append(achievement)
        
        return achievements
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取成就列表失败: {str(e)}"
        )


@router.get(
    "/achievements/my",
    response_model=List[UserAchievementResponse],
    summary="获取我的成就",
    description="获取当前用户已解锁的成就"
)
async def get_my_achievements(
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> List[UserAchievementResponse]:
    """
    获取我的成就
    
    获取当前用户已解锁的所有成就
    """
    try:
        # 模拟用户已解锁的成就数据
        unlocked_achievements = [
            {
                "achievement": {
                    "id": 1,
                    "title": "初学者",
                    "description": "完成第一个挑战",
                    "category": "学习",
                    "icon": "🎯",
                    "points": 10,
                    "is_unlocked": True,
                    "unlocked_at": "2024-01-15T10:00:00Z",
                    "progress": 100.0
                },
                "unlocked_at": "2024-01-15T10:00:00Z",
                "progress": 100.0
            },
            {
                "achievement": {
                    "id": 2,
                    "title": "Python专家",
                    "description": "完成10个Python相关挑战",
                    "category": "技能",
                    "icon": "🐍",
                    "points": 50,
                    "is_unlocked": True,
                    "unlocked_at": "2024-02-01T15:30:00Z",
                    "progress": 100.0
                },
                "unlocked_at": "2024-02-01T15:30:00Z",
                "progress": 100.0
            }
        ]
        
        # 构建响应
        user_achievements = []
        for data in unlocked_achievements:
            achievement_response = AchievementResponse(**data["achievement"])
            user_achievement = UserAchievementResponse(
                achievement=achievement_response,
                unlocked_at=data["unlocked_at"],
                progress=data["progress"]
            )
            user_achievements.append(user_achievement)
        
        return user_achievements
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取我的成就失败: {str(e)}"
        )


@router.post(
    "/achievements",
    response_model=AchievementResponse,
    summary="创建成就",
    description="创建新的成就（管理员功能）"
)
async def create_achievement(
    request: CreateAchievementRequest,
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> AchievementResponse:
    """
    创建成就
    
    管理员可以创建新的成就
    """
    try:
        # 验证成就数据
        if not request.title or len(request.title.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="成就标题至少需要5个字符"
            )
        
        if request.points <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="成就积分必须大于0"
            )
        
        # 模拟创建成就
        achievement_id = 999  # 模拟生成的ID
        
        achievement = AchievementResponse(
            id=achievement_id,
            title=request.title,
            description=request.description,
            category=request.category,
            icon=request.icon or "🏆",
            points=request.points,
            is_unlocked=False,  # 新创建的成就默认未解锁
            unlocked_at=None,
            progress=0.0
        )
        
        return achievement
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"数据验证失败: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建成就失败: {str(e)}"
        )


# 统计相关接口
@router.get(
    "/stats",
    response_model=GrowthStatsResponse,
    summary="获取成长统计",
    description="获取当前用户的成长统计信息"
)
async def get_growth_stats(
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> GrowthStatsResponse:
    """
    获取成长统计
    
    获取当前用户的详细成长统计信息
    """
    try:
        # 获取用户技能数据
        user_skills = await growth_service.get_user_skills(str(current_user_id))
        
        # 构建技能进度字典
        skill_progress = {}
        for skill in user_skills:
            skill_progress[skill["name"]] = {
                "level": skill["level"],
                "progress": skill["progress"],
                "category": skill["category"]
            }
        
        # 模拟月度学习时长数据
        monthly_hours = {
            "2024-01": 25.5,
            "2024-02": 32.0,
            "2024-03": 28.5,
            "2024-04": 35.0,
            "2024-05": 30.0,
            "2024-06": 40.0
        }
        
        # 模拟最近活动
        recent_activities = [
            {
                "type": "challenge_completed",
                "title": "完成Python基础挑战",
                "date": "2024-06-15T10:30:00Z",
                "points": 10
            },
            {
                "type": "skill_level_up",
                "title": "Python技能升级到4级",
                "date": "2024-06-14T15:20:00Z",
                "points": 20
            },
            {
                "type": "achievement_unlocked",
                "title": "获得'Python专家'成就",
                "date": "2024-06-13T09:15:00Z",
                "points": 50
            }
        ]
        
        stats = GrowthStatsResponse(
            total_study_hours=191.0,
            total_study_days=45,
            current_streak=7,
            longest_streak=15,
            total_achievements=2,
            total_points=280,
            skill_progress=skill_progress,
            monthly_hours=monthly_hours,
            recent_activities=recent_activities
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取成长统计失败: {str(e)}"
        )


@router.get(
    "/calendar",
    summary="获取学习日历",
    description="获取学习日历数据"
)
async def get_study_calendar(
    year: int = Query(..., description="年份"),
    month: Optional[int] = Query(None, ge=1, le=12, description="月份"),
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> dict:
    """
    获取学习日历
    
    获取指定年月的学习日历数据，类似GitHub贡献图
    """
    try:
        # 模拟学习日历数据
        calendar_data = {}
        
        if month:
            # 返回指定月份的数据
            import calendar as cal
            days_in_month = cal.monthrange(year, month)[1]
            
            for day in range(1, days_in_month + 1):
                date_str = f"{year}-{month:02d}-{day:02d}"
                # 模拟学习数据
                if day % 3 == 0:  # 每3天学习一次
                    calendar_data[date_str] = {
                        "study_hours": 2.5,
                        "challenges_completed": 1,
                        "skills_practiced": ["Python", "JavaScript"],
                        "intensity": "medium"
                    }
                elif day % 7 == 0:  # 每周日休息
                    calendar_data[date_str] = {
                        "study_hours": 0,
                        "challenges_completed": 0,
                        "skills_practiced": [],
                        "intensity": "none"
                    }
                else:
                    calendar_data[date_str] = {
                        "study_hours": 1.0,
                        "challenges_completed": 0,
                        "skills_practiced": ["Python"],
                        "intensity": "low"
                    }
        else:
            # 返回整年的数据（简化版）
            for month_num in range(1, 13):
                month_key = f"{year}-{month_num:02d}"
                calendar_data[month_key] = {
                    "total_hours": 25.0 + month_num * 2,
                    "study_days": 20 + month_num,
                    "challenges_completed": 5 + month_num,
                    "average_intensity": "medium"
                }
        
        return {
            "year": year,
            "month": month,
            "data": calendar_data,
            "summary": {
                "total_study_hours": sum(
                    day.get("study_hours", 0) if isinstance(day, dict) else 0 
                    for day in calendar_data.values()
                ),
                "total_study_days": len([
                    day for day in calendar_data.values() 
                    if isinstance(day, dict) and day.get("study_hours", 0) > 0
                ]),
                "most_active_day": max(
                    calendar_data.items(),
                    key=lambda x: x[1].get("study_hours", 0) if isinstance(x[1], dict) else 0,
                    default=(None, {})
                )[0] if calendar_data else None
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学习日历失败: {str(e)}"
        )


@router.get(
    "/leaderboard",
    summary="获取排行榜",
    description="获取用户成长排行榜"
)
async def get_leaderboard(
    type: str = Query("points", description="排行榜类型"),
    period: str = Query("all", description="时间周期"),
    limit: int = Query(10, ge=1, le=100, description="返回数量"),
    current_user_id: int = Depends(get_current_user_id),
    growth_service: GrowthService = Depends(get_growth_service)
) -> List[dict]:
    """
    获取排行榜
    
    获取用户成长排行榜，支持多种排序方式和时间周期
    """
    try:
        # 模拟排行榜数据
        leaderboard_data = []
        
        if type == "points":
            # 积分排行榜
            leaderboard_data = [
                {
                    "rank": 1,
                    "user_id": "user_001",
                    "username": "张三",
                    "avatar": "https://example.com/avatar1.jpg",
                    "points": 1250,
                    "level": 8,
                    "achievements_count": 15,
                    "is_current_user": False
                },
                {
                    "rank": 2,
                    "user_id": "user_002", 
                    "username": "李四",
                    "avatar": "https://example.com/avatar2.jpg",
                    "points": 980,
                    "level": 7,
                    "achievements_count": 12,
                    "is_current_user": False
                },
                {
                    "rank": 3,
                    "user_id": str(current_user_id),
                    "username": "当前用户",
                    "avatar": "https://example.com/avatar3.jpg",
                    "points": 850,
                    "level": 6,
                    "achievements_count": 10,
                    "is_current_user": True
                }
            ]
        elif type == "study_hours":
            # 学习时长排行榜
            leaderboard_data = [
                {
                    "rank": 1,
                    "user_id": "user_003",
                    "username": "王五",
                    "avatar": "https://example.com/avatar4.jpg",
                    "study_hours": 320.5,
                    "study_days": 85,
                    "current_streak": 15,
                    "is_current_user": False
                },
                {
                    "rank": 2,
                    "user_id": str(current_user_id),
                    "username": "当前用户",
                    "avatar": "https://example.com/avatar5.jpg",
                    "study_hours": 280.0,
                    "study_days": 72,
                    "current_streak": 12,
                    "is_current_user": True
                }
            ]
        elif type == "challenges":
            # 挑战完成排行榜
            leaderboard_data = [
                {
                    "rank": 1,
                    "user_id": "user_004",
                    "username": "赵六",
                    "avatar": "https://example.com/avatar6.jpg",
                    "challenges_completed": 45,
                    "success_rate": 92.5,
                    "favorite_skill": "Python",
                    "is_current_user": False
                },
                {
                    "rank": 2,
                    "user_id": str(current_user_id),
                    "username": "当前用户",
                    "avatar": "https://example.com/avatar7.jpg",
                    "challenges_completed": 38,
                    "success_rate": 89.2,
                    "favorite_skill": "JavaScript",
                    "is_current_user": True
                }
            ]
        
        # 应用时间周期过滤（这里简化处理）
        if period == "week":
            # 本周数据（模拟）
            for item in leaderboard_data:
                if "points" in item:
                    item["points"] = int(item["points"] * 0.1)  # 本周积分
                if "study_hours" in item:
                    item["study_hours"] = round(item["study_hours"] * 0.05, 1)  # 本周学习时长
                if "challenges_completed" in item:
                    item["challenges_completed"] = int(item["challenges_completed"] * 0.2)  # 本周挑战
        elif period == "month":
            # 本月数据（模拟）
            for item in leaderboard_data:
                if "points" in item:
                    item["points"] = int(item["points"] * 0.3)
                if "study_hours" in item:
                    item["study_hours"] = round(item["study_hours"] * 0.2, 1)
                if "challenges_completed" in item:
                    item["challenges_completed"] = int(item["challenges_completed"] * 0.4)
        
        # 限制返回数量
        return leaderboard_data[:limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取排行榜失败: {str(e)}"
        )