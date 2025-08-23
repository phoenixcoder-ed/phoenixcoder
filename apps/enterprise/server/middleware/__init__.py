"""
中间件模块

包含各种FastAPI中间件，用于处理请求日志、认证、CORS、限流、错误处理等功能。
"""

from .logging_middleware import LoggingMiddleware, RequestContextMiddleware, get_request_logger
from .auth import AuthMiddleware, OptionalAuthMiddleware, get_current_user, get_optional_user
from .cors import setup_cors, get_cors_config
from .rate_limit import RateLimitMiddleware, AdaptiveRateLimitMiddleware, rate_limit
from .error_handler import ErrorHandlerMiddleware, GlobalExceptionHandler, create_error_response

__all__ = [
    # 日志中间件
    'LoggingMiddleware',
    'RequestContextMiddleware', 
    'get_request_logger',
    
    # 认证中间件
    'AuthMiddleware',
    'OptionalAuthMiddleware',
    'get_current_user',
    'get_optional_user',
    
    # CORS中间件
    'setup_cors',
    'get_cors_config',
    
    # 限流中间件
    'RateLimitMiddleware',
    'AdaptiveRateLimitMiddleware',
    'rate_limit',
    
    # 错误处理中间件
    'ErrorHandlerMiddleware',
    'GlobalExceptionHandler',
    'create_error_response'
]