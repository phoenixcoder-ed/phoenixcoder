"""
技能管理API

提供技能管理相关的API接口，包括：
- 技能查询
- 用户技能管理
- 技能认证
- 技能统计
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from services.auth_service import AuthService
from services.skill_service import SkillService, SkillCreateData, SkillSearchFilters, UserSkillData
from services.user_service import UserService
from shared.container import get_auth_service, get_skill_service, get_user_service
from shared.exceptions import ValidationError, AuthorizationError, ResourceNotFoundError, SkillNotFoundError
from database.models.skill import SkillCategory

router = APIRouter()
security = HTTPBearer()


# 请求模型
class AddUserSkillRequest(BaseModel):
    """添加用户技能请求"""
    skill_name: str = Field(..., min_length=2, max_length=50, description="技能名称")
    level: int = Field(..., ge=1, le=5, description="技能等级(1-5)")
    experience_years: Optional[float] = Field(None, ge=0, description="经验年数")
    description: Optional[str] = Field(None, max_length=500, description="技能描述")
    certificates: Optional[List[str]] = Field(default=[], description="相关证书")


class UpdateUserSkillRequest(BaseModel):
    """更新用户技能请求"""
    level: Optional[int] = Field(None, ge=1, le=5, description="技能等级(1-5)")
    experience_years: Optional[float] = Field(None, ge=0, description="经验年数")
    description: Optional[str] = Field(None, max_length=500, description="技能描述")
    certificates: Optional[List[str]] = Field(None, description="相关证书")


class CreateSkillRequest(BaseModel):
    """创建技能请求"""
    name: str = Field(..., min_length=2, max_length=50, description="技能名称")
    category: str = Field(..., description="技能分类")
    description: Optional[str] = Field(None, max_length=1000, description="技能描述")
    tags: Optional[List[str]] = Field(default=[], description="技能标签")


# 响应模型
class SkillResponse(BaseModel):
    """技能响应"""
    id: int
    name: str
    category: str
    description: Optional[str]
    tags: List[str]
    user_count: int
    created_at: str


class UserSkillResponse(BaseModel):
    """用户技能响应"""
    id: int
    skill_id: int
    skill_name: str
    skill_category: str
    level: int
    experience_years: Optional[float]
    description: Optional[str]
    certificates: List[str]
    is_verified: bool
    verified_at: Optional[str]
    created_at: str
    updated_at: str


class SkillListResponse(BaseModel):
    """技能列表响应"""
    skills: List[SkillResponse]
    total: int
    page: int
    size: int
    pages: int


class UserSkillListResponse(BaseModel):
    """用户技能列表响应"""
    skills: List[UserSkillResponse]
    total: int


class SkillStatsResponse(BaseModel):
    """技能统计响应"""
    total_skills: int
    total_user_skills: int
    top_skills: List[dict]
    skill_categories: dict


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


@router.get(
    "/",
    response_model=SkillListResponse,
    summary="获取技能列表",
    description="获取系统中的技能列表"
)
async def get_skills(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    category: Optional[str] = Query(None, description="技能分类"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> SkillListResponse:
    """
    获取技能列表
    
    获取系统中所有可用的技能，支持分类筛选和搜索
    """
    try:
        # 构建搜索过滤器
        filters = SkillSearchFilters(
            category=SkillCategory(category) if category else None,
            search_term=search
        )
        
        # 搜索技能
        result = await skill_service.search_skills(filters, page, size)
        skills = result["skills"]
        total = result["total"]
        total_pages = result["total_pages"]
        
        # 构建响应列表
        skill_responses = []
        for skill in skills:
            skill_responses.append(SkillResponse(
                id=int(skill.id),
                name=skill.name,
                category=skill.category.value,
                description=skill.description,
                tags=skill.tags or [],
                user_count=skill.user_count or 0,
                created_at=skill.created_at.isoformat()
            ))
        
        return SkillListResponse(
            skills=skill_responses,
            total=total,
            page=page,
            size=size,
            pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取技能列表失败"
        )


@router.post(
    "/",
    response_model=SkillResponse,
    summary="创建技能",
    description="创建新的技能（管理员功能）"
)
async def create_skill(
    request: CreateSkillRequest,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> SkillResponse:
    """
    创建技能
    
    管理员可以创建新的技能类型
    """
    try:
        # 构建技能创建数据
        skill_data = SkillCreateData(
            name=request.name,
            description=request.description,
            category=SkillCategory(request.category),
            tags=request.tags or []
        )
        
        # 创建技能
        skill = await skill_service.create_skill(skill_data, str(current_user_id))
        
        # 构建响应
        return SkillResponse(
            id=int(skill.id),
            name=skill.name,
            category=skill.category.value,
            description=skill.description,
            tags=skill.tags or [],
            user_count=0,
            created_at=skill.created_at.isoformat()
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以创建技能"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建技能失败"
        )


@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
    summary="获取技能详情",
    description="根据技能ID获取技能详细信息"
)
async def get_skill(
    skill_id: str,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> SkillResponse:
    """
    获取技能详情
    
    根据技能ID获取技能的详细信息
    """
    try:
        # 获取技能详情
        skill = await skill_service.get_skill(skill_id)
        
        # 构建响应
        return SkillResponse(
            id=int(skill.id),
            name=skill.name,
            category=skill.category.value,
            description=skill.description,
            tags=skill.tags or [],
            user_count=skill.user_count or 0,
            created_at=skill.created_at.isoformat()
        )
        
    except SkillNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="技能不存在"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取技能详情失败"
        )


@router.get(
    "/categories",
    summary="获取技能分类",
    description="获取所有技能分类"
)
async def get_skill_categories(
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> List[dict]:
    """
    获取技能分类
    
    获取系统中所有的技能分类
    """
    try:
        # 模拟技能分类数据
        categories = [
            {
                "id": "programming",
                "name": "编程语言",
                "description": "各种编程语言技能",
                "icon": "💻",
                "skill_count": 25,
                "popular_skills": ["Python", "JavaScript", "Java", "Go", "Rust"]
            },
            {
                "id": "frontend",
                "name": "前端开发",
                "description": "前端开发相关技能",
                "icon": "🎨",
                "skill_count": 18,
                "popular_skills": ["React", "Vue.js", "Angular", "TypeScript", "CSS"]
            },
            {
                "id": "backend",
                "name": "后端开发",
                "description": "后端开发相关技能",
                "icon": "⚙️",
                "skill_count": 22,
                "popular_skills": ["Node.js", "Django", "Spring Boot", "FastAPI", "Express"]
            },
            {
                "id": "database",
                "name": "数据库",
                "description": "数据库相关技能",
                "icon": "🗄️",
                "skill_count": 12,
                "popular_skills": ["MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch"]
            },
            {
                "id": "devops",
                "name": "运维开发",
                "description": "DevOps和运维相关技能",
                "icon": "🔧",
                "skill_count": 15,
                "popular_skills": ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform"]
            },
            {
                "id": "mobile",
                "name": "移动开发",
                "description": "移动应用开发技能",
                "icon": "📱",
                "skill_count": 10,
                "popular_skills": ["React Native", "Flutter", "Swift", "Kotlin", "Xamarin"]
            },
            {
                "id": "ai_ml",
                "name": "人工智能",
                "description": "AI和机器学习相关技能",
                "icon": "🤖",
                "skill_count": 14,
                "popular_skills": ["TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "NLP"]
            },
            {
                "id": "design",
                "name": "设计",
                "description": "UI/UX设计相关技能",
                "icon": "🎭",
                "skill_count": 8,
                "popular_skills": ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"]
            }
        ]
        
        return categories
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取技能分类失败: {str(e)}"
        )


@router.get(
    "/my",
    response_model=UserSkillListResponse,
    summary="获取我的技能",
    description="获取当前用户的技能列表"
)
async def get_my_skills(
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> UserSkillListResponse:
    """
    获取我的技能
    
    获取当前用户的所有技能
    """
    try:
        # 模拟用户技能数据
        from datetime import datetime, timedelta
        
        user_skills = [
            UserSkillResponse(
                id=1,
                skill_id=101,
                skill_name="Python",
                skill_category="programming",
                level=4,
                experience_years=3.5,
                description="熟练掌握Python编程，有丰富的Web开发和数据分析经验",
                certificates=["Python Institute PCAP", "Python数据分析认证"],
                is_verified=True,
                verified_at=(datetime.now() - timedelta(days=30)).isoformat(),
                created_at=(datetime.now() - timedelta(days=365)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=7)).isoformat()
            ),
            UserSkillResponse(
                id=2,
                skill_id=102,
                skill_name="JavaScript",
                skill_category="programming",
                level=3,
                experience_years=2.0,
                description="掌握ES6+语法，熟悉前端框架开发",
                certificates=["JavaScript高级程序设计认证"],
                is_verified=False,
                verified_at=None,
                created_at=(datetime.now() - timedelta(days=300)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=15)).isoformat()
            ),
            UserSkillResponse(
                id=3,
                skill_id=201,
                skill_name="React",
                skill_category="frontend",
                level=3,
                experience_years=1.5,
                description="熟悉React Hooks、状态管理和组件化开发",
                certificates=[],
                is_verified=False,
                verified_at=None,
                created_at=(datetime.now() - timedelta(days=200)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=5)).isoformat()
            ),
            UserSkillResponse(
                id=4,
                skill_id=301,
                skill_name="Docker",
                skill_category="devops",
                level=2,
                experience_years=1.0,
                description="了解容器化部署，能够编写Dockerfile和docker-compose",
                certificates=[],
                is_verified=False,
                verified_at=None,
                created_at=(datetime.now() - timedelta(days=150)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=20)).isoformat()
            ),
            UserSkillResponse(
                id=5,
                skill_id=401,
                skill_name="MySQL",
                skill_category="database",
                level=3,
                experience_years=2.5,
                description="熟练使用MySQL进行数据库设计和优化",
                certificates=["MySQL DBA认证"],
                is_verified=True,
                verified_at=(datetime.now() - timedelta(days=60)).isoformat(),
                created_at=(datetime.now() - timedelta(days=400)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=10)).isoformat()
            )
        ]
        
        return UserSkillListResponse(
            skills=user_skills,
            total=len(user_skills)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取我的技能失败: {str(e)}"
        )


@router.post(
    "/my",
    response_model=UserSkillResponse,
    summary="添加我的技能",
    description="为当前用户添加新技能"
)
async def add_my_skill(
    request: AddUserSkillRequest,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> UserSkillResponse:
    """
    添加我的技能
    
    为当前用户添加新的技能
    """
    try:
        from datetime import datetime
        
        # 验证技能名称
        if not request.skill_name or len(request.skill_name.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="技能名称至少需要2个字符"
            )
        
        # 验证经验年数
        if request.experience_years is not None and request.experience_years < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="经验年数不能为负数"
            )
        
        # 模拟检查技能是否已存在
        # 这里简化处理，实际应该查询数据库
        
        # 模拟创建用户技能
        user_skill_id = 999  # 模拟生成的ID
        skill_id = 999  # 模拟技能ID
        
        # 根据技能名称推断分类
        skill_category = "programming"  # 默认分类
        if request.skill_name.lower() in ["react", "vue", "angular", "css", "html"]:
            skill_category = "frontend"
        elif request.skill_name.lower() in ["docker", "kubernetes", "aws", "jenkins"]:
            skill_category = "devops"
        elif request.skill_name.lower() in ["mysql", "postgresql", "mongodb", "redis"]:
            skill_category = "database"
        elif request.skill_name.lower() in ["figma", "sketch", "photoshop"]:
            skill_category = "design"
        
        user_skill = UserSkillResponse(
            id=user_skill_id,
            skill_id=skill_id,
            skill_name=request.skill_name,
            skill_category=skill_category,
            level=request.level,
            experience_years=request.experience_years,
            description=request.description,
            certificates=request.certificates or [],
            is_verified=False,  # 新添加的技能默认未认证
            verified_at=None,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        
        return user_skill
        
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
            detail=f"添加技能失败: {str(e)}"
        )


@router.put(
    "/my/{user_skill_id}",
    response_model=UserSkillResponse,
    summary="更新我的技能",
    description="更新当前用户的技能信息"
)
async def update_my_skill(
    user_skill_id: int,
    request: UpdateUserSkillRequest,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> UserSkillResponse:
    """
    更新我的技能
    
    更新当前用户的技能信息
    """
    try:
        from datetime import datetime, timedelta
        
        # 验证用户技能ID
        if user_skill_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户技能不存在"
            )
        
        # 验证经验年数
        if request.experience_years is not None and request.experience_years < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="经验年数不能为负数"
            )
        
        # 模拟获取现有技能信息并更新
        # 这里使用模拟数据，实际应该从数据库获取
        updated_skill = UserSkillResponse(
            id=user_skill_id,
            skill_id=101,  # 模拟技能ID
            skill_name="Python",  # 保持原技能名称
            skill_category="programming",  # 保持原分类
            level=request.level if request.level is not None else 3,
            experience_years=request.experience_years if request.experience_years is not None else 2.0,
            description=request.description if request.description is not None else "更新后的技能描述",
            certificates=request.certificates if request.certificates is not None else ["Python认证"],
            is_verified=False,  # 更新后需要重新认证
            verified_at=None,
            created_at=(datetime.now() - timedelta(days=100)).isoformat(),  # 保持原创建时间
            updated_at=datetime.now().isoformat()
        )
        
        return updated_skill
        
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
            detail=f"更新技能失败: {str(e)}"
        )


@router.delete(
    "/my/{user_skill_id}",
    summary="删除我的技能",
    description="删除当前用户的技能"
)
async def delete_my_skill(
    user_skill_id: int,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> dict:
    """
    删除我的技能
    
    删除当前用户的指定技能
    """
    try:
        from datetime import datetime
        
        # 验证用户技能ID
        if user_skill_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户技能不存在"
            )
        
        # 模拟检查技能是否属于当前用户
        # 这里简化处理，实际应该查询数据库验证所有权
        
        # 模拟删除操作
        return {
            "message": f"技能 {user_skill_id} 已成功删除",
            "deleted_skill_id": user_skill_id,
            "deleted_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除技能失败: {str(e)}"
        )


@router.get(
    "/users/{user_id}",
    response_model=UserSkillListResponse,
    summary="获取用户技能",
    description="获取指定用户的技能列表"
)
async def get_user_skills(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> UserSkillListResponse:
    """
    获取用户技能
    
    获取指定用户的公开技能信息
    """
    try:
        from datetime import datetime, timedelta
        
        # 验证用户ID
        if user_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 模拟用户技能数据（只显示公开的技能）
        user_skills = [
            UserSkillResponse(
                id=1,
                skill_id=101,
                skill_name="Python",
                skill_category="programming",
                level=4,
                experience_years=3.0,
                description="熟练掌握Python编程，有丰富的Web开发经验",
                certificates=["Python Institute PCAP"],
                is_verified=True,
                verified_at=(datetime.now() - timedelta(days=30)).isoformat(),
                created_at=(datetime.now() - timedelta(days=365)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=7)).isoformat()
            ),
            UserSkillResponse(
                id=2,
                skill_id=102,
                skill_name="JavaScript",
                skill_category="programming",
                level=3,
                experience_years=2.5,
                description="掌握ES6+语法，熟悉前端框架开发",
                certificates=[],
                is_verified=False,
                verified_at=None,
                created_at=(datetime.now() - timedelta(days=300)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=15)).isoformat()
            ),
            UserSkillResponse(
                id=3,
                skill_id=201,
                skill_name="React",
                skill_category="frontend",
                level=3,
                experience_years=2.0,
                description="熟悉React开发，有多个项目经验",
                certificates=[],
                is_verified=True,
                verified_at=(datetime.now() - timedelta(days=45)).isoformat(),
                created_at=(datetime.now() - timedelta(days=200)).isoformat(),
                updated_at=(datetime.now() - timedelta(days=5)).isoformat()
            )
        ]
        
        # 如果查询的是自己，返回所有技能；如果是其他用户，只返回公开的技能
        if user_id != current_user_id:
            # 这里简化处理，实际应该根据用户隐私设置过滤
            pass
        
        return UserSkillListResponse(
            skills=user_skills,
            total=len(user_skills)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户技能失败: {str(e)}"
        )


@router.post(
    "/my/{user_skill_id}/verify",
    summary="申请技能认证",
    description="申请技能认证"
)
async def request_skill_verification(
    user_skill_id: int,
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> dict:
    """
    申请技能认证
    
    用户可以申请对自己的技能进行认证
    """
    try:
        from datetime import datetime
        
        # 验证用户技能ID
        if user_skill_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户技能不存在"
            )
        
        # 模拟检查技能是否属于当前用户
        # 这里简化处理，实际应该查询数据库验证所有权
        
        # 模拟检查是否已经认证
        # 实际应该查询数据库检查认证状态
        
        # 模拟检查是否已有待审核的申请
        # 实际应该查询认证申请表
        
        # 模拟创建认证申请
        certification_id = f"cert_{user_skill_id}_{int(datetime.now().timestamp())}"
        
        return {
            "message": "技能认证申请已提交",
            "certification_id": certification_id,
            "user_skill_id": user_skill_id,
            "status": "pending",
            "applied_at": datetime.now().isoformat(),
            "estimated_review_days": 3
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"申请技能认证失败: {str(e)}"
        )


@router.get(
    "/stats",
    response_model=SkillStatsResponse,
    summary="获取技能统计",
    description="获取技能相关的统计信息"
)
async def get_skill_stats(
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> SkillStatsResponse:
    """
    获取技能统计
    
    获取平台技能的统计信息，包括热门技能、技能分布等
    """
    try:
        # 模拟技能统计数据
        stats_data = {
            "total_skills": 156,
            "total_users_with_skills": 1234,
            "verified_skills": 89,
            "pending_certifications": 23,
            "popular_skills": [
                {"skill_name": "Python", "user_count": 456, "avg_level": 3.2},
                {"skill_name": "JavaScript", "user_count": 398, "avg_level": 3.0},
                {"skill_name": "React", "user_count": 287, "avg_level": 2.8},
                {"skill_name": "Java", "user_count": 234, "avg_level": 3.1},
                {"skill_name": "Node.js", "user_count": 198, "avg_level": 2.9}
            ],
            "skill_categories": [
                {"category": "programming", "skill_count": 45, "user_count": 890},
                {"category": "frontend", "skill_count": 28, "user_count": 567},
                {"category": "backend", "skill_count": 32, "user_count": 445},
                {"category": "database", "skill_count": 18, "user_count": 334},
                {"category": "devops", "skill_count": 22, "user_count": 223},
                {"category": "mobile", "skill_count": 11, "user_count": 156}
            ],
            "level_distribution": [
                {"level": 1, "user_count": 234},
                {"level": 2, "user_count": 345},
                {"level": 3, "user_count": 456},
                {"level": 4, "user_count": 234},
                {"level": 5, "user_count": 123}
            ],
            "monthly_growth": {
                "new_skills_added": 12,
                "new_users_with_skills": 89,
                "certifications_completed": 15
            }
        }
        
        return SkillStatsResponse(**stats_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取技能统计失败: {str(e)}"
        )


@router.get(
    "/recommendations",
    response_model=SkillListResponse,
    summary="获取技能推荐",
    description="基于用户当前技能推荐相关技能"
)
async def get_skill_recommendations(
    limit: int = Query(10, ge=1, le=50, description="推荐数量"),
    current_user_id: int = Depends(get_current_user_id),
    skill_service: SkillService = Depends(get_skill_service)
) -> SkillListResponse:
    """
    获取技能推荐
    
    基于用户当前技能栈推荐相关或互补的技能
    """
    try:
        from datetime import datetime, timedelta
        
        # 模拟基于用户技能的推荐算法
        # 实际应该根据用户当前技能、学习历史、行业趋势等进行推荐
        
        recommended_skills = [
            SkillResponse(
                id=301,
                name="Docker",
                category="devops",
                description="容器化技术，用于应用部署和环境管理",
                tags=["容器", "部署", "DevOps"],
                user_count=234,
                created_at=(datetime.now() - timedelta(days=100)).isoformat()
            ),
            SkillResponse(
                id=302,
                name="Kubernetes",
                category="devops",
                description="容器编排平台，用于大规模容器化应用管理",
                tags=["容器编排", "微服务", "云原生"],
                user_count=167,
                created_at=(datetime.now() - timedelta(days=80)).isoformat()
            ),
            SkillResponse(
                id=303,
                name="TypeScript",
                category="programming",
                description="JavaScript的超集，提供静态类型检查",
                tags=["类型安全", "前端", "JavaScript"],
                user_count=345,
                created_at=(datetime.now() - timedelta(days=120)).isoformat()
            ),
            SkillResponse(
                id=304,
                name="GraphQL",
                category="backend",
                description="API查询语言和运行时，提供更高效的数据获取",
                tags=["API", "查询语言", "数据获取"],
                user_count=189,
                created_at=(datetime.now() - timedelta(days=90)).isoformat()
            ),
            SkillResponse(
                id=305,
                name="Redis",
                category="database",
                description="内存数据结构存储，用作数据库、缓存和消息代理",
                tags=["缓存", "内存数据库", "NoSQL"],
                user_count=278,
                created_at=(datetime.now() - timedelta(days=150)).isoformat()
            )
        ]
        
        # 根据limit参数限制返回数量
        limited_skills = recommended_skills[:limit]
        
        return SkillListResponse(
            skills=limited_skills,
            total=len(limited_skills),
            page=1,
            size=limit,
            pages=1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取技能推荐失败: {str(e)}"
        )