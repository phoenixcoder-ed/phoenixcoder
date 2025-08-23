import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from logging_config import get_logger
import logging

logger = get_logger('middleware')

class LoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""
    
    def __init__(self, app, log_requests: bool = True, log_responses: bool = True):
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 生成请求ID
        request_id = str(uuid.uuid4())[:8]
        
        # 将请求ID添加到请求状态中
        request.state.request_id = request_id
        
        # 记录请求开始时间
        start_time = time.time()
        
        # 创建带有请求ID的日志记录
        log_record = logging.LogRecord(
            name=logger.name,
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="",
            args=(),
            exc_info=None
        )
        log_record.request_id = request_id
        
        # 记录请求信息
        if self.log_requests:
            client_ip = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent", "")
            
            # 使用带请求ID的logger记录
            extra = {"request_id": request_id}
            logger.info(
                f"请求开始 - {request.method} {request.url.path} - "
                f"客户端IP: {client_ip} - User-Agent: {user_agent[:100]}",
                extra=extra
            )
            
            # 记录请求体（仅对POST/PUT/PATCH请求，且不记录敏感信息）
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        # 注意：这里不能直接读取body，因为会影响后续处理
                        logger.debug(f"请求Content-Type: {content_type}", extra=extra)
                    except Exception as e:
                        logger.warning(f"无法记录请求体: {e}", extra=extra)
        
        # 处理请求
        try:
            response = await call_next(request)
        except Exception as e:
            # 记录异常
            process_time = time.time() - start_time
            extra = {"request_id": request_id}
            logger.error(
                f"请求异常 - {request.method} {request.url.path} - "
                f"处理时间: {process_time:.3f}s - 异常: {str(e)}",
                extra=extra,
                exc_info=True
            )
            raise
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 添加请求ID到响应头
        response.headers["X-Request-ID"] = request_id
        
        # 记录响应信息
        if self.log_responses:
            extra = {"request_id": request_id}
            
            # 根据状态码选择日志级别
            if response.status_code >= 500:
                log_level = logger.error
            elif response.status_code >= 400:
                log_level = logger.warning
            else:
                log_level = logger.info
            
            log_level(
                f"请求完成 - {request.method} {request.url.path} - "
                f"状态码: {response.status_code} - 处理时间: {process_time:.3f}s",
                extra=extra
            )
            
            # 记录慢请求
            if process_time > 1.0:  # 超过1秒的请求
                logger.warning(
                    f"慢请求警告 - {request.method} {request.url.path} - "
                    f"处理时间: {process_time:.3f}s",
                    extra=extra
                )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """获取客户端真实IP地址"""
        # 检查代理头
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # 返回直接连接的IP
        return request.client.host if request.client else "unknown"

class RequestContextMiddleware(BaseHTTPMiddleware):
    """请求上下文中间件，用于在整个请求生命周期中传递请求ID"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 如果还没有请求ID，生成一个
        if not hasattr(request.state, 'request_id'):
            request.state.request_id = str(uuid.uuid4())[:8]
        
        # 将请求ID设置到当前线程的日志上下文中
        request_id = request.state.request_id
        
        # 创建一个自定义的日志适配器
        class RequestLoggerAdapter(logging.LoggerAdapter):
            def process(self, msg, kwargs):
                return f"[{request_id}] {msg}", kwargs
        
        # 将适配器添加到请求状态中，供其他地方使用
        request.state.logger_adapter = RequestLoggerAdapter
        
        response = await call_next(request)
        return response

def get_request_logger(request: Request, name: str = None) -> logging.Logger:
    """
    获取带有请求ID的logger
    
    Args:
        request: FastAPI请求对象
        name: logger名称
    
    Returns:
        带有请求ID的logger适配器
    """
    base_logger = get_logger(name)
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    class RequestLoggerAdapter(logging.LoggerAdapter):
        def process(self, msg, kwargs):
            kwargs.setdefault('extra', {})['request_id'] = request_id
            return msg, kwargs
    
    return RequestLoggerAdapter(base_logger, {})