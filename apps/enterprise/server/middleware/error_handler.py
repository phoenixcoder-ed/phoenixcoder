"""
错误处理中间件

统一处理应用程序异常和错误响应
"""

import time
import traceback
import logging
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError

from shared.exceptions import (
    BaseApplicationError,
    ValidationError as CustomValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ResourceConflictError,
    RateLimitExceededError,
    ExternalServiceError
)
from config.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """错误处理中间件"""
    
    def __init__(self, app, include_debug_info: bool = None):
        super().__init__(app)
        self.include_debug_info = (
            include_debug_info 
            if include_debug_info is not None 
            else settings.environment == "development"
        )
    
    async def dispatch(self, request: Request, call_next):
        """处理请求"""
        try:
            response = await call_next(request)
            return response
            
        except Exception as exc:
            return await self._handle_exception(request, exc)
    
    async def _handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """处理异常"""
        # 记录异常
        await self._log_exception(request, exc)
        
        # 根据异常类型返回相应的错误响应
        if isinstance(exc, HTTPException):
            return self._handle_http_exception(exc)
        elif isinstance(exc, BaseApplicationError):
            return self._handle_custom_exception(exc)
        elif isinstance(exc, ValidationError):
            return self._handle_validation_error(exc)
        else:
            return self._handle_unexpected_exception(exc)
    
    def _handle_http_exception(self, exc: HTTPException) -> JSONResponse:
        """处理HTTP异常"""
        error_response = {
            "error": "http_error",
            "message": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time()
        }
        
        if self.include_debug_info:
            error_response["type"] = "HTTPException"
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response,
            headers=getattr(exc, "headers", None)
        )
    
    def _handle_custom_exception(self, exc: BaseApplicationError) -> JSONResponse:
        """处理自定义异常"""
        # 映射自定义异常到HTTP状态码
        status_code_mapping = {
            CustomValidationError: status.HTTP_400_BAD_REQUEST,
            AuthenticationError: status.HTTP_401_UNAUTHORIZED,
            AuthorizationError: status.HTTP_403_FORBIDDEN,
            ResourceNotFoundError: status.HTTP_404_NOT_FOUND,
            ResourceConflictError: status.HTTP_409_CONFLICT,
            RateLimitExceededError: status.HTTP_429_TOO_MANY_REQUESTS,
            ExternalServiceError: status.HTTP_502_BAD_GATEWAY,
        }
        
        status_code = status_code_mapping.get(type(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        error_response = {
            "error": exc.error_code,
            "message": str(exc),
            "status_code": status_code,
            "timestamp": time.time()
        }
        
        # 添加额外的错误信息
        if hasattr(exc, "details") and exc.details:
            error_response["details"] = exc.details
        
        if self.include_debug_info:
            error_response["type"] = type(exc).__name__
            if hasattr(exc, "context"):
                error_response["context"] = exc.context
        
        return JSONResponse(
            status_code=status_code,
            content=error_response
        )
    
    def _handle_validation_error(self, exc: ValidationError) -> JSONResponse:
        """处理Pydantic验证错误"""
        error_details = []
        
        for error in exc.errors():
            field_path = " -> ".join(str(loc) for loc in error["loc"])
            error_details.append({
                "field": field_path,
                "message": error["msg"],
                "type": error["type"],
                "input": error.get("input")
            })
        
        error_response = {
            "error": "validation_error",
            "message": "请求数据验证失败",
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "details": error_details,
            "timestamp": time.time()
        }
        
        if self.include_debug_info:
            error_response["type"] = "ValidationError"
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response
        )
    
    def _handle_unexpected_exception(self, exc: Exception) -> JSONResponse:
        """处理未预期的异常"""
        error_response = {
            "error": "internal_server_error",
            "message": "服务器内部错误",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "timestamp": time.time()
        }
        
        if self.include_debug_info:
            error_response.update({
                "type": type(exc).__name__,
                "details": str(exc),
                "traceback": traceback.format_exc()
            })
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response
        )
    
    async def _log_exception(self, request: Request, exc: Exception):
        """记录异常日志"""
        # 获取请求信息
        request_info = {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "client": request.client.host if request.client else None,
            "user_id": getattr(request.state, "user_id", None),
            "timestamp": time.time()
        }
        
        # 根据异常类型选择日志级别
        if isinstance(exc, (HTTPException, BaseApplicationError)):
            if isinstance(exc, HTTPException) and exc.status_code < 500:
                log_level = logging.WARNING
            elif isinstance(exc, BaseApplicationError):
                log_level = logging.WARNING
            else:
                log_level = logging.ERROR
        else:
            log_level = logging.ERROR
        
        # 记录日志
        logger.log(
            log_level,
            f"Exception occurred: {type(exc).__name__}: {str(exc)}",
            extra={
                "exception_type": type(exc).__name__,
                "exception_message": str(exc),
                "request_info": request_info,
                "traceback": traceback.format_exc() if log_level == logging.ERROR else None
            }
        )


class GlobalExceptionHandler:
    """全局异常处理器"""
    
    @staticmethod
    def setup_exception_handlers(app):
        """设置全局异常处理器"""
        
        @app.exception_handler(HTTPException)
        async def http_exception_handler(request: Request, exc: HTTPException):
            """HTTP异常处理器"""
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": "http_error",
                    "message": exc.detail,
                    "status_code": exc.status_code,
                    "timestamp": time.time()
                }
            )
        
        @app.exception_handler(ValidationError)
        async def validation_exception_handler(request: Request, exc: ValidationError):
            """验证异常处理器"""
            error_details = []
            for error in exc.errors():
                field_path = " -> ".join(str(loc) for loc in error["loc"])
                error_details.append({
                    "field": field_path,
                    "message": error["msg"],
                    "type": error["type"]
                })
            
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": "validation_error",
                    "message": "请求数据验证失败",
                    "details": error_details,
                    "timestamp": time.time()
                }
            )
        
        @app.exception_handler(BaseApplicationError)
        async def custom_exception_handler(request: Request, exc: BaseApplicationError):
            """自定义异常处理器"""
            status_code_mapping = {
                "validation_error": status.HTTP_400_BAD_REQUEST,
                "authentication_error": status.HTTP_401_UNAUTHORIZED,
                "authorization_error": status.HTTP_403_FORBIDDEN,
                "not_found_error": status.HTTP_404_NOT_FOUND,
                "conflict_error": status.HTTP_409_CONFLICT,
                "rate_limit_error": status.HTTP_429_TOO_MANY_REQUESTS,
                "external_service_error": status.HTTP_502_BAD_GATEWAY,
            }
            
            status_code = status_code_mapping.get(exc.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return JSONResponse(
                status_code=status_code,
                content={
                    "error": exc.error_code,
                    "message": str(exc),
                    "timestamp": time.time()
                }
            )
        
        @app.exception_handler(Exception)
        async def general_exception_handler(request: Request, exc: Exception):
            """通用异常处理器"""
            logger.error(
                f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
                extra={
                    "exception_type": type(exc).__name__,
                    "exception_message": str(exc),
                    "traceback": traceback.format_exc(),
                    "request_url": str(request.url),
                    "request_method": request.method
                }
            )
            
            error_response = {
                "error": "internal_server_error",
                "message": "服务器内部错误",
                "timestamp": time.time()
            }
            
            # 开发环境下包含详细错误信息
            if settings.environment == "development":
                error_response.update({
                    "type": type(exc).__name__,
                    "details": str(exc),
                    "traceback": traceback.format_exc()
                })
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response
            )


def create_error_response(
    error_code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """创建标准错误响应"""
    error_response = {
        "error": error_code,
        "message": message,
        "status_code": status_code,
        "timestamp": time.time()
    }
    
    if details:
        error_response["details"] = details
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )