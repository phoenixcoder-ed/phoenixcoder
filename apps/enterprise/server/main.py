"""
PhoenixCoder 主应用程序

现代化的程序员任务平台后端服务
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config.settings import get_settings
from shared.container import get_container, container_lifespan
from shared.startup_health import create_server_health_checker
from middleware import (
    setup_cors,
    AuthMiddleware,
    RateLimitMiddleware,
    ErrorHandlerMiddleware,
    GlobalExceptionHandler,
    LoggingMiddleware,
    RequestContextMiddleware
)
from api.v1 import router as v1_router
from api import router as api_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用程序生命周期管理"""
    logger.info("🚀 启动 PhoenixCoder 服务...")
    
    # 创建启动健康检查器
    health_checker = create_server_health_checker()
    
    try:
        # 执行启动健康检查
        await health_checker.check_all_dependencies()
        logger.info("✅ 启动健康检查通过")
    except Exception as e:
        logger.warning(f"⚠️ 启动健康检查部分失败: {e}")
        logger.info("🔧 服务将在降级模式下启动")
    
    # 启动时初始化
    async with container_lifespan():
        logger.info("✅ 依赖注入容器初始化完成")
        
        # 初始化数据库
        try:
            container = get_container()
            from database.base import DatabaseManager
            db_manager = container.get(DatabaseManager)
            logger.info("✅ 数据库连接初始化完成")
        except Exception as e:
            logger.error(f"❌ 数据库初始化失败: {e}")
            # 不抛出异常，允许服务在无数据库模式下启动
            db_manager = None
        
        logger.info("🎉 PhoenixCoder 服务启动完成!")
        
        yield
        
        # 关闭时清理
        logger.info("🔄 正在关闭 PhoenixCoder 服务...")
        
        try:
            if db_manager:
                await db_manager.close()
                logger.info("✅ 数据库连接已关闭")
        except Exception as e:
            logger.error(f"❌ 数据库关闭失败: {e}")
        
        logger.info("👋 PhoenixCoder 服务已关闭")


def create_app() -> FastAPI:
    """创建FastAPI应用程序"""
    
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
        openapi_url="/openapi.json" if settings.environment != "production" else None,
        lifespan=lifespan
    )
    
    # 设置CORS
    setup_cors(app)
    
    # 添加中间件（注意顺序很重要）
    
    # 1. 请求上下文中间件（最外层）
    app.add_middleware(RequestContextMiddleware)
    
    # 2. 错误处理中间件
    app.add_middleware(ErrorHandlerMiddleware)
    
    # 3. 日志中间件
    app.add_middleware(LoggingMiddleware)
    
    # 4. 限流中间件
    app.add_middleware(RateLimitMiddleware)
    
    # 5. 认证中间件（最内层，靠近业务逻辑）
    app.add_middleware(AuthMiddleware)
    
    # 设置全局异常处理器
    GlobalExceptionHandler.setup_exception_handlers(app)
    
    return app


# 创建应用实例
app = create_app()

# 注册路由
app.include_router(v1_router, prefix="/api/v1", tags=["v1"])
app.include_router(api_router, prefix="/api", tags=["api"])

# 根路径
@app.get("/", tags=["root"])
async def root():
    """根路径健康检查"""
    return {
        "message": "Welcome to PhoenixCoder API",
        "version": settings.app_version,
        "environment": settings.environment,
        "status": "healthy"
    }

# 健康检查
@app.get("/health", tags=["health"])
async def health_check():
    """简单健康检查"""
    return {
        "status": "healthy",
        "timestamp": asyncio.get_event_loop().time(),
        "version": settings.app_version
    }

# 应用信息
@app.get("/info", tags=["info"])
async def app_info():
    """应用程序信息"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": settings.app_description,
        "environment": settings.environment,
        "python_version": "3.13",
        "features": [
            "用户认证与授权",
            "任务管理系统", 
            "技能评估体系",
            "成长记录追踪",
            "实时通知系统",
            "文件上传管理",
            "API限流保护",
            "全面错误处理",
            "结构化日志记录"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    # 开发环境配置
    if settings.environment == "development":
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
    else:
        # 生产环境配置
        uvicorn.run(
            app,
            host="0.0.0.0", 
            port=settings.port,
            workers=settings.workers,
            log_level="warning",
            access_log=False
        )
