"""
API v1 版本

提供RESTful API接口的v1版本，包括：
- 认证相关API
- 用户管理API
- 任务管理API
- 技能管理API
- 成长记录API
"""

from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .tasks import router as tasks_router
from .skills import router as skills_router
from .growth import router as growth_router
from .health import router as health_router

# 创建API路由器
router = APIRouter()

# 注册子路由
router.include_router(
    health_router,
    prefix="/health",
    tags=["健康检查"]
)

router.include_router(
    auth_router,
    prefix="/auth",
    tags=["认证"]
)

router.include_router(
    users_router,
    prefix="/users",
    tags=["用户管理"]
)

router.include_router(
    tasks_router,
    prefix="/tasks",
    tags=["任务管理"]
)

router.include_router(
    skills_router,
    prefix="/skills",
    tags=["技能管理"]
)

router.include_router(
    growth_router,
    prefix="/growth",
    tags=["成长记录"]
)

__all__ = ["router"]