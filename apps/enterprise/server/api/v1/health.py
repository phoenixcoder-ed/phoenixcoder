"""
健康检查API

提供系统健康状态检查接口
"""

from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from shared.container import get_database_manager, get_settings
from database.base import DatabaseManager
from config.settings import Settings

router = APIRouter()


class HealthStatus(BaseModel):
    """健康状态响应模型"""
    status: str
    timestamp: datetime
    version: str
    environment: str
    services: Dict[str, Any]


class ServiceStatus(BaseModel):
    """服务状态模型"""
    status: str
    response_time_ms: float
    details: Dict[str, Any] = {}


@router.get(
    "/",
    response_model=HealthStatus,
    summary="系统健康检查",
    description="检查系统整体健康状态，包括数据库、Redis等服务"
)
async def health_check(
    db_manager: DatabaseManager = Depends(get_database_manager),
    config: Settings = Depends(get_settings)
) -> HealthStatus:
    """
    系统健康检查
    
    返回系统整体健康状态，包括：
    - 应用状态
    - 数据库连接状态
    - Redis连接状态
    - 系统信息
    """
    services = {}
    overall_status = "healthy"
    
    # 检查数据库连接
    try:
        start_time = datetime.now()
        async with db_manager.get_session() as session:
            await session.execute("SELECT 1")
        db_response_time = (datetime.now() - start_time).total_seconds() * 1000
        
        services["database"] = ServiceStatus(
            status="healthy",
            response_time_ms=db_response_time,
            details={
                "host": config.database.host,
                "port": config.database.port,
                "database": config.database.name
            }
        ).dict()
    except Exception as e:
        services["database"] = ServiceStatus(
            status="unhealthy",
            response_time_ms=0,
            details={"error": str(e)}
        ).dict()
        overall_status = "unhealthy"
    
    # 检查Redis连接（如果配置了Redis）
    try:
        import redis.asyncio as redis
        start_time = datetime.now()
        redis_client = redis.from_url(config.redis.url)
        await redis_client.ping()
        redis_response_time = (datetime.now() - start_time).total_seconds() * 1000
        await redis_client.close()
        
        services["redis"] = ServiceStatus(
            status="healthy",
            response_time_ms=redis_response_time,
            details={
                "host": config.redis.host,
                "port": config.redis.port,
                "database": config.redis.db
            }
        ).dict()
    except Exception as e:
        services["redis"] = ServiceStatus(
            status="unhealthy",
            response_time_ms=0,
            details={"error": str(e)}
        ).dict()
        # Redis不是关键服务，不影响整体状态
    
    return HealthStatus(
        status=overall_status,
        timestamp=datetime.now(),
        version=config.app_version,
        environment=config.environment,
        services=services
    )


@router.get(
    "/ready",
    summary="就绪检查",
    description="检查应用是否准备好接收请求"
)
async def readiness_check(
    db_manager: DatabaseManager = Depends(get_database_manager)
) -> Dict[str, str]:
    """
    就绪检查
    
    检查应用是否准备好接收请求，主要检查关键依赖服务
    """
    try:
        # 检查数据库连接
        async with db_manager.get_session() as session:
            await session.execute("SELECT 1")
        
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {str(e)}"
        )


@router.get(
    "/live",
    summary="存活检查",
    description="检查应用是否存活"
)
async def liveness_check() -> Dict[str, str]:
    """
    存活检查
    
    简单的存活检查，确认应用进程正在运行
    """
    return {"status": "alive"}


@router.get(
    "/metrics",
    summary="基础指标",
    description="获取基础系统指标"
)
async def basic_metrics(
    config: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """
    基础指标
    
    返回基础系统指标信息
    """
    import psutil
    import os
    
    # 获取进程信息
    process = psutil.Process(os.getpid())
    
    return {
        "application": {
            "name": config.app_name,
            "version": config.app_version,
            "environment": config.environment,
            "uptime_seconds": (datetime.now() - datetime.fromtimestamp(process.create_time())).total_seconds()
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        },
        "process": {
            "pid": os.getpid(),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "cpu_percent": process.cpu_percent(),
            "threads": process.num_threads()
        }
    }