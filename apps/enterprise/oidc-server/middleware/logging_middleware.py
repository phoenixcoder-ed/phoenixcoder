import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from logging_config import get_logger, auth_info, auth_warning, auth_error
import logging

logger = get_logger('middleware')

class OIDCLoggingMiddleware(BaseHTTPMiddleware):
    """OIDC服务器专用日志中间件"""
    
    def __init__(self, app, log_requests: bool = True, log_responses: bool = True):
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
        # 认证相关的路径
        self.auth_paths = {
            '/authorize', '/login', '/token', '/userinfo', 
            '/wechat/callback', '/register', '/.well-known/openid_configuration'
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 生成请求ID
        request_id = str(uuid.uuid4())[:8]
        
        # 将请求ID添加到请求状态中
        request.state.request_id = request_id
        
        # 记录请求开始时间
        start_time = time.time()
        
        # 判断是否为认证相关请求
        is_auth_request = any(request.url.path.startswith(path) for path in self.auth_paths)
        
        # 记录请求信息
        if self.log_requests:
            client_ip = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent", "")
            
            extra = {"request_id": request_id}
            
            if is_auth_request:
                # 认证相关请求使用专门的认证日志
                auth_info(
                    f"认证请求开始 - {request.method} {request.url.path} - "
                    f"客户端IP: {client_ip} - User-Agent: {user_agent[:100]}"
                )
                
                # 记录查询参数（排除敏感信息）
                if request.query_params:
                    safe_params = {}
                    for key, value in request.query_params.items():
                        if key.lower() in ['password', 'secret', 'token']:
                            safe_params[key] = "***"
                        else:
                            safe_params[key] = value
                    auth_info(f"查询参数: {safe_params}")
            else:
                logger.info(
                    f"请求开始 - {request.method} {request.url.path} - "
                    f"客户端IP: {client_ip} - User-Agent: {user_agent[:100]}",
                    extra=extra
                )
        
        # 处理请求
        try:
            response = await call_next(request)
        except Exception as e:
            # 记录异常
            process_time = time.time() - start_time
            extra = {"request_id": request_id}
            
            if is_auth_request:
                auth_error(
                    f"认证请求异常 - {request.method} {request.url.path} - "
                    f"处理时间: {process_time:.3f}s - 异常: {str(e)}"
                )
            else:
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
            
            if is_auth_request:
                # 认证相关响应
                if response.status_code >= 400:
                    auth_warning(
                        f"认证请求失败 - {request.method} {request.url.path} - "
                        f"状态码: {response.status_code} - 处理时间: {process_time:.3f}s"
                    )
                else:
                    auth_info(
                        f"认证请求成功 - {request.method} {request.url.path} - "
                        f"状态码: {response.status_code} - 处理时间: {process_time:.3f}s"
                    )
            else:
                # 普通请求响应
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
                if is_auth_request:
                    auth_warning(
                        f"认证慢请求警告 - {request.method} {request.url.path} - "
                        f"处理时间: {process_time:.3f}s"
                    )
                else:
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