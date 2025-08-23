"""PhoenixCoder 主应用程序

现代化的程序员任务平台后端服务
"""

import sys
import os

# 添加父目录到Python路径以访问shared模块
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)

# 添加当前目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import uvicorn
import asyncio
import signal
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from shared.logger import get_logger
from shared.startup_health import create_server_health_checker
from config.settings import Settings

def get_settings():
    return Settings()

# 优雅退出相关的全局变量
_shutdown_event = asyncio.Event()
_active_requests = 0
_max_shutdown_wait = 30  # 最大等待时间（秒）


def setup_signal_handlers():
    """设置信号处理器"""
    def signal_handler(signum, frame):
        logger.info(f"收到信号 {signum}，开始优雅退出...")
        _shutdown_event.set()
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)


class RequestCounterMiddleware(BaseHTTPMiddleware):
    """请求计数中间件"""
    
    async def dispatch(self, request: Request, call_next):
        global _active_requests
        
        # 如果正在关闭，拒绝新请求
        if _shutdown_event.is_set():
            return JSONResponse(
                status_code=503,
                content={"detail": "服务正在关闭，请稍后重试"}
            )
        
        # 增加活跃请求计数
        _active_requests += 1
        
        try:
            response = await call_next(request)
            return response
        finally:
            # 减少活跃请求计数
            _active_requests -= 1
# 获取日志记录器
logger = get_logger(__name__)

settings = get_settings()

# 数据库模型将在需要时导入
logger.info("✅ 服务初始化完成")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用程序生命周期管理"""
    logger.info("🚀 正在启动 PhoenixCoder Server...")
    
    # 创建健康检查器
    health_checker = create_server_health_checker()
    
    try:
        # 执行启动健康检查
        await health_checker.check_all_dependencies()
        logger.info("✅ 启动健康检查通过")
    except Exception as e:
        logger.warning(f"⚠️ 启动健康检查部分失败: {e}")
        logger.info("🔧 服务将在降级模式下启动")
    
    logger.info("🎉 PhoenixCoder Server 启动完成!")
    
    yield
    
    # 优雅关闭逻辑
    logger.info("🔄 正在优雅关闭 PhoenixCoder Server...")
    
    # 等待活跃请求完成
    if _active_requests > 0:
        logger.info(f"⏳ 等待 {_active_requests} 个活跃请求完成...")
        start_time = time.time()
        
        while _active_requests > 0:
            elapsed = time.time() - start_time
            if elapsed >= _max_shutdown_wait:
                logger.warning(f"⚠️ 等待超时 ({_max_shutdown_wait}s)，强制关闭服务")
                break
            
            await asyncio.sleep(0.1)
    
    logger.info("👋 PhoenixCoder Server 已优雅关闭")


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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_credentials,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
    )
    
    # 添加请求计数中间件
    app.add_middleware(RequestCounterMiddleware)
    
    return app


# 创建应用实例
app = create_app()

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
    """详细健康检查"""
    
    # 确定整体服务状态
    overall_status = "healthy"
    message = "服务运行正常"
    
    # 检查是否正在关闭
    if _shutdown_event.is_set():
        overall_status = "shutting_down"
        message = "服务正在优雅关闭中"
    
    return {
        "status": overall_status,
        "message": message,
        "timestamp": time.time(),
        "version": settings.app_version,
        "active_requests": _active_requests,
        "shutting_down": _shutdown_event.is_set(),
        "components": {
            "api": {
                "status": "healthy",
                "message": "API 服务正常"
            }
        }
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
            port=8001,
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
