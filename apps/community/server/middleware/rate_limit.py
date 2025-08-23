"""
限流中间件

提供API请求限流功能，防止滥用
"""

import time
import asyncio
from typing import Dict, Optional, Tuple
from collections import defaultdict, deque
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config.settings import get_settings

settings = get_settings()


class TokenBucket:
    """令牌桶算法实现"""
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity  # 桶容量
        self.tokens = capacity    # 当前令牌数
        self.refill_rate = refill_rate  # 每秒补充令牌数
        self.last_refill = time.time()
        self._lock = asyncio.Lock()
    
    async def consume(self, tokens: int = 1) -> bool:
        """消费令牌"""
        async with self._lock:
            now = time.time()
            # 计算需要补充的令牌数
            time_passed = now - self.last_refill
            tokens_to_add = time_passed * self.refill_rate
            
            # 补充令牌，不超过容量
            self.tokens = min(self.capacity, self.tokens + tokens_to_add)
            self.last_refill = now
            
            # 检查是否有足够的令牌
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
    
    def get_wait_time(self, tokens: int = 1) -> float:
        """获取需要等待的时间"""
        if self.tokens >= tokens:
            return 0
        
        needed_tokens = tokens - self.tokens
        return needed_tokens / self.refill_rate


class SlidingWindowCounter:
    """滑动窗口计数器"""
    
    def __init__(self, window_size: int, max_requests: int):
        self.window_size = window_size  # 窗口大小(秒)
        self.max_requests = max_requests  # 最大请求数
        self.requests = deque()  # 请求时间戳队列
        self._lock = asyncio.Lock()
    
    async def is_allowed(self) -> Tuple[bool, int, float]:
        """检查是否允许请求"""
        async with self._lock:
            now = time.time()
            
            # 移除过期的请求记录
            while self.requests and self.requests[0] <= now - self.window_size:
                self.requests.popleft()
            
            # 检查是否超过限制
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                remaining = self.max_requests - len(self.requests)
                reset_time = now + self.window_size
                return True, remaining, reset_time
            else:
                remaining = 0
                # 计算重置时间（最早请求过期时间）
                reset_time = self.requests[0] + self.window_size
                return False, remaining, reset_time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """限流中间件"""
    
    def __init__(self, app, default_rate_limit: Optional[str] = None):
        super().__init__(app)
        self.default_rate_limit = default_rate_limit or f"{settings.security.rate_limit_per_minute}/minute"
        
        # 存储每个客户端的限流器
        self.rate_limiters: Dict[str, SlidingWindowCounter] = {}
        self.token_buckets: Dict[str, TokenBucket] = {}
        
        # 清理过期限流器的任务
        self._cleanup_task = None
        self._start_cleanup_task()
    
    def _start_cleanup_task(self):
        """启动清理任务"""
        async def cleanup():
            while True:
                await asyncio.sleep(300)  # 每5分钟清理一次
                await self._cleanup_expired_limiters()
        
        self._cleanup_task = asyncio.create_task(cleanup())
    
    async def _cleanup_expired_limiters(self):
        """清理过期的限流器"""
        now = time.time()
        expired_keys = []
        
        for key, limiter in self.rate_limiters.items():
            # 如果限流器超过1小时没有活动，则清理
            if hasattr(limiter, 'last_access') and now - limiter.last_access > 3600:
                expired_keys.append(key)
        
        for key in expired_keys:
            self.rate_limiters.pop(key, None)
            self.token_buckets.pop(key, None)
    
    async def dispatch(self, request: Request, call_next):
        """处理请求"""
        # 获取客户端标识
        client_id = self._get_client_id(request)
        
        # 检查是否需要限流
        if self._should_skip_rate_limit(request):
            response = await call_next(request)
            return response
        
        # 获取限流配置
        rate_limit_config = self._get_rate_limit_config(request)
        
        # 检查限流
        allowed, remaining, reset_time = await self._check_rate_limit(
            client_id, rate_limit_config
        )
        
        if not allowed:
            return self._rate_limit_exceeded_response(remaining, reset_time)
        
        # 继续处理请求
        response = await call_next(request)
        
        # 添加限流头
        response.headers["X-Rate-Limit-Remaining"] = str(remaining)
        response.headers["X-Rate-Limit-Reset"] = str(int(reset_time))
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """获取客户端标识"""
        # 优先使用用户ID（如果已认证）
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # 使用IP地址
        client_ip = request.client.host if request.client else "unknown"
        
        # 检查是否有代理头
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            client_ip = real_ip
        
        return f"ip:{client_ip}"
    
    def _should_skip_rate_limit(self, request: Request) -> bool:
        """检查是否应该跳过限流"""
        path = request.url.path
        
        # 跳过健康检查和静态资源
        skip_paths = [
            "/api/v1/health",
            "/api/v1/health/live",
            "/api/v1/health/ready",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]
        
        for skip_path in skip_paths:
            if path.startswith(skip_path):
                return True
        
        return False
    
    def _get_rate_limit_config(self, request: Request) -> dict:
        """获取限流配置"""
        # 默认配置
        config = {
            "requests": settings.security.rate_limit_per_minute,
            "window": 60,  # 1分钟
            "burst": settings.security.rate_limit_burst
        }
        
        # 根据路径调整配置
        path = request.url.path
        
        # 认证相关接口更严格的限制
        if "/auth/" in path:
            config["requests"] = min(config["requests"], 10)
            config["burst"] = min(config["burst"], 5)
        
        # 上传接口限制
        if "/upload" in path:
            config["requests"] = min(config["requests"], 20)
        
        return config
    
    async def _check_rate_limit(self, client_id: str, config: dict) -> Tuple[bool, int, float]:
        """检查限流"""
        # 获取或创建限流器
        if client_id not in self.rate_limiters:
            self.rate_limiters[client_id] = SlidingWindowCounter(
                window_size=config["window"],
                max_requests=config["requests"]
            )
        
        limiter = self.rate_limiters[client_id]
        limiter.last_access = time.time()  # 更新最后访问时间
        
        return await limiter.is_allowed()
    
    def _rate_limit_exceeded_response(self, remaining: int, reset_time: float) -> JSONResponse:
        """返回限流超出响应"""
        retry_after = max(1, int(reset_time - time.time()))
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "rate_limit_exceeded",
                "message": "请求过于频繁，请稍后再试",
                "retry_after": retry_after,
                "timestamp": time.time()
            },
            headers={
                "Retry-After": str(retry_after),
                "X-Rate-Limit-Remaining": str(remaining),
                "X-Rate-Limit-Reset": str(int(reset_time))
            }
        )


class AdaptiveRateLimitMiddleware(RateLimitMiddleware):
    """自适应限流中间件
    
    根据系统负载动态调整限流策略
    """
    
    def __init__(self, app, default_rate_limit: Optional[str] = None):
        super().__init__(app, default_rate_limit)
        self.system_load = 0.0
        self.error_rate = 0.0
        self.last_adjustment = time.time()
    
    def _get_rate_limit_config(self, request: Request) -> dict:
        """获取自适应限流配置"""
        base_config = super()._get_rate_limit_config(request)
        
        # 根据系统负载调整
        load_factor = 1.0
        if self.system_load > 0.8:
            load_factor = 0.5  # 高负载时减少50%限制
        elif self.system_load > 0.6:
            load_factor = 0.7  # 中等负载时减少30%限制
        
        # 根据错误率调整
        error_factor = 1.0
        if self.error_rate > 0.1:
            error_factor = 0.6  # 高错误率时更严格限制
        elif self.error_rate > 0.05:
            error_factor = 0.8
        
        # 应用调整因子
        adjustment_factor = min(load_factor, error_factor)
        base_config["requests"] = int(base_config["requests"] * adjustment_factor)
        base_config["burst"] = int(base_config["burst"] * adjustment_factor)
        
        return base_config
    
    def update_system_metrics(self, load: float, error_rate: float):
        """更新系统指标"""
        self.system_load = load
        self.error_rate = error_rate
        self.last_adjustment = time.time()


# 便捷的装饰器
def rate_limit(requests_per_minute: int = None, burst: int = None):
    """限流装饰器"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 这里可以实现基于装饰器的限流逻辑
            # 目前主要通过中间件实现
            return await func(*args, **kwargs)
        
        # 设置限流元数据
        wrapper._rate_limit_config = {
            "requests_per_minute": requests_per_minute,
            "burst": burst
        }
        
        return wrapper
    return decorator