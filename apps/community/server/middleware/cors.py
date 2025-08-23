"""
CORS中间件配置

处理跨域资源共享(CORS)配置
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import get_settings

settings = get_settings()


def setup_cors(app: FastAPI) -> None:
    """设置CORS中间件"""
    
    # 开发环境允许所有来源
    if settings.environment == "development":
        allowed_origins = ["*"]
        allow_credentials = False
    else:
        # 生产环境使用配置的来源
        allowed_origins = settings.cors_origins
        allow_credentials = settings.cors_credentials
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=allow_credentials,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
        expose_headers=[
            "X-Process-Time",
            "X-Request-ID", 
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset"
        ],
        max_age=3600  # 默认1小时
    )


def get_cors_config() -> dict:
    """获取CORS配置信息"""
    return {
        "allowed_origins": settings.cors_origins,
        "allowed_methods": settings.cors_methods,
        "allowed_headers": settings.cors_headers,
        "allow_credentials": settings.cors_credentials,
        "max_age": 3600,
        "environment": settings.environment
    }