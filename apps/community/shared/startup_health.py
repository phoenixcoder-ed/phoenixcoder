#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
启动健康检查模块
提供服务启动时的依赖检查、超时处理和健康验证功能
"""

import asyncio
import time
import logging
import aiohttp
import psycopg2
import redis
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum
from shared.logger import get_logger
# 动态导入配置，支持不同服务的配置结构
try:
    # 优先使用当前服务的配置
    from config.settings import get_settings
except ImportError:
    # 回退到共享配置
    from shared.config import get_settings

logger = get_logger(__name__)


class HealthStatus(Enum):
    """健康状态枚举"""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"


@dataclass
class HealthCheckResult:
    """健康检查结果"""
    name: str
    status: HealthStatus
    message: str
    duration: float
    details: Optional[Dict[str, Any]] = None


@dataclass
class DependencyConfig:
    """依赖配置"""
    name: str
    check_func: Callable
    timeout: int = 10
    required: bool = True
    retry_count: int = 3
    retry_delay: float = 1.0


class StartupHealthChecker:
    """启动健康检查器"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.dependencies: List[DependencyConfig] = []
        self.settings = get_settings()
    
    def add_dependency(self, config: DependencyConfig):
        """添加依赖检查"""
        self.dependencies.append(config)
    
    async def check_dependency(self, config: DependencyConfig) -> HealthCheckResult:
        """检查单个依赖"""
        start_time = time.time()
        
        for attempt in range(config.retry_count):
            try:
                logger.info(f"检查依赖 {config.name} (尝试 {attempt + 1}/{config.retry_count})")
                
                # 执行健康检查
                result = await asyncio.wait_for(
                    config.check_func(),
                    timeout=config.timeout
                )
                
                duration = time.time() - start_time
                
                # 检查结果是否为字典格式
                if isinstance(result, dict):
                    if result.get('healthy', False):
                        logger.info(f"✅ 依赖 {config.name} 检查通过 ({duration:.2f}s)")
                        return HealthCheckResult(
                            name=config.name,
                            status=HealthStatus.HEALTHY,
                            message="依赖检查通过",
                            duration=duration,
                            details=result
                        )
                    else:
                        logger.warning(f"⚠️ 依赖 {config.name} 检查失败")
                        if attempt < config.retry_count - 1:
                            await asyncio.sleep(config.retry_delay)
                            continue
                        
                        duration = time.time() - start_time
                        return HealthCheckResult(
                            name=config.name,
                            status=HealthStatus.UNHEALTHY,
                            message=result.get('error', '依赖检查失败'),
                            duration=duration,
                            details=result
                        )
                # 兼容旧的布尔返回值
                elif result:
                    logger.info(f"✅ 依赖 {config.name} 检查通过 ({duration:.2f}s)")
                    return HealthCheckResult(
                        name=config.name,
                        status=HealthStatus.HEALTHY,
                        message="依赖检查通过",
                        duration=duration,
                        details={"legacy_result": True}
                    )
                else:
                    logger.warning(f"⚠️ 依赖 {config.name} 检查失败")
                    if attempt < config.retry_count - 1:
                        await asyncio.sleep(config.retry_delay)
                        continue
                    
                    duration = time.time() - start_time
                    return HealthCheckResult(
                        name=config.name,
                        status=HealthStatus.UNHEALTHY,
                        message="依赖检查失败",
                        duration=duration
                    )
                    
            except asyncio.TimeoutError:
                duration = time.time() - start_time
                logger.error(f"❌ 依赖 {config.name} 检查超时 ({config.timeout}s)")
                return HealthCheckResult(
                    name=config.name,
                    status=HealthStatus.TIMEOUT,
                    message=f"检查超时 ({config.timeout}s)",
                    duration=duration
                )
            except Exception as e:
                logger.error(f"❌ 依赖 {config.name} 检查异常: {e}")
                if attempt < config.retry_count - 1:
                    await asyncio.sleep(config.retry_delay)
                    continue
                
                duration = time.time() - start_time
                return HealthCheckResult(
                    name=config.name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"检查异常: {str(e)}",
                    duration=duration
                )
        
        # 所有重试都失败
        duration = time.time() - start_time
        return HealthCheckResult(
            name=config.name,
            status=HealthStatus.UNHEALTHY,
            message="所有重试都失败",
            duration=duration
        )
    
    async def check_all_dependencies(self) -> Dict[str, HealthCheckResult]:
        """检查所有依赖"""
        logger.info(f"🔍 开始检查 {self.service_name} 的依赖...")
        
        results = {}
        failed_required = []
        
        # 并发检查所有依赖
        tasks = []
        for config in self.dependencies:
            task = asyncio.create_task(self.check_dependency(config))
            tasks.append((config, task))
        
        # 等待所有检查完成
        for config, task in tasks:
            result = await task
            results[config.name] = result
            
            # 检查必需依赖是否失败
            if config.required and result.status != HealthStatus.HEALTHY:
                failed_required.append(config.name)
        
        # 汇总结果
        total_duration = sum(r.duration for r in results.values())
        healthy_count = sum(1 for r in results.values() if r.status == HealthStatus.HEALTHY)
        total_count = len(results)
        
        logger.info("\n" + "="*50)
        logger.info("📊 依赖检查汇总报告")
        logger.info("="*50)
        
        if healthy_count == total_count:
            logger.info(f"✅ 所有依赖检查通过 ({healthy_count}/{total_count}) (耗时 {total_duration:.2f}s)")
        else:
            logger.warning(f"⚠️ 部分依赖检查失败 ({healthy_count}/{total_count}) (耗时 {total_duration:.2f}s)")
            
        # 详细显示每个依赖的状态
        for name, result in results.items():
            if result.status == HealthStatus.HEALTHY:
                logger.info(f"  ✅ {name}: 健康 ({result.duration:.2f}s)")
                # 显示连接信息
                if result.details and 'connection_info' in result.details:
                    conn_info = result.details['connection_info']
                    if 'host' in conn_info and 'port' in conn_info:
                        logger.info(f"     📍 {conn_info['host']}:{conn_info['port']}")
            else:
                logger.error(f"  ❌ {name}: {result.status.value} ({result.duration:.2f}s)")
                logger.error(f"     ❗ {result.message}")
        
        logger.info("="*50 + "\n")
        
        if failed_required:
            logger.error(f"❌ 必需依赖检查失败: {', '.join(failed_required)}")
            raise RuntimeError(f"必需依赖检查失败: {', '.join(failed_required)}")
        
        return results
    
    async def wait_for_startup_complete(self, max_wait_time: int = 60) -> bool:
        """等待启动完成"""
        logger.info(f"⏳ 等待 {self.service_name} 启动完成 (最大等待 {max_wait_time}s)")
        
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            try:
                results = await self.check_all_dependencies()
                
                # 检查是否所有必需依赖都健康
                required_healthy = all(
                    results[config.name].status == HealthStatus.HEALTHY
                    for config in self.dependencies
                    if config.required
                )
                
                if required_healthy:
                    elapsed = time.time() - start_time
                    logger.info(f"✅ {self.service_name} 启动完成 (耗时 {elapsed:.2f}s)")
                    return True
                
                # 等待一段时间后重试
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.warning(f"启动检查异常: {e}")
                await asyncio.sleep(2)
        
        logger.error(f"❌ {self.service_name} 启动超时 ({max_wait_time}s)")
        return False


# 预定义的健康检查函数

async def check_postgresql_health() -> Dict[str, Any]:
    """检查 PostgreSQL 健康状态并返回详细信息"""
    settings = get_settings()
    
    connection_info = {
        "host": settings.database.host,
        "port": settings.database.port,
        "database": settings.database.db,
        "user": settings.database.user
    }
    
    try:
        start_time = time.time()
        conn = psycopg2.connect(
            host=settings.database.host,
            port=settings.database.port,
            database=settings.database.db,
            user=settings.database.user,
            password=settings.database.password,
            connect_timeout=5
        )
        
        with conn.cursor() as cursor:
            cursor.execute("SELECT version()")
            version_result = cursor.fetchone()
            cursor.execute("SELECT current_database()")
            db_result = cursor.fetchone()
        
        connection_time = time.time() - start_time
        conn.close()
        
        logger.info(f"🗄️ PostgreSQL 连接成功")
        logger.info(f"   📍 主机: {settings.database.host}:{settings.database.port}")
        logger.info(f"   🏷️ 数据库: {settings.database.db}")
        logger.info(f"   👤 用户: {settings.database.user}")
        logger.info(f"   ⏱️ 连接时间: {connection_time:.3f}s")
        logger.info(f"   📋 版本: {version_result[0] if version_result else 'Unknown'}")
        
        return {
            "healthy": True,
            "connection_info": connection_info,
            "connection_time": connection_time,
            "version": version_result[0] if version_result else None,
            "current_database": db_result[0] if db_result else None
        }
        
    except Exception as e:
        logger.error(f"❌ PostgreSQL 连接失败")
        logger.error(f"   📍 主机: {settings.database.host}:{settings.database.port}")
        logger.error(f"   🏷️ 数据库: {settings.database.db}")
        logger.error(f"   👤 用户: {settings.database.user}")
        logger.error(f"   ❗ 错误: {str(e)}")
        
        return {
            "healthy": False,
            "connection_info": connection_info,
            "error": str(e)
        }


async def check_redis_health() -> Dict[str, Any]:
    """检查 Redis 健康状态并返回详细信息"""
    settings = get_settings()
    
    connection_info = {
        "host": settings.redis.host,
        "port": settings.redis.port,
        "password_set": bool(settings.redis.password)
    }
    
    try:
        start_time = time.time()
        client = redis.Redis(
            host=settings.redis.host,
            port=settings.redis.port,
            password=settings.redis.password,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        
        # 执行ping测试
        ping_result = client.ping()
        
        # 获取Redis信息
        info = client.info()
        redis_version = info.get('redis_version', 'Unknown')
        used_memory = info.get('used_memory_human', 'Unknown')
        connected_clients = info.get('connected_clients', 0)
        
        connection_time = time.time() - start_time
        client.close()
        
        logger.info(f"🔄 Redis 连接成功")
        logger.info(f"   📍 主机: {settings.redis.host}:{settings.redis.port}")
        logger.info(f"   🔐 密码: {'已设置' if settings.redis.password else '未设置'}")
        logger.info(f"   ⏱️ 连接时间: {connection_time:.3f}s")
        logger.info(f"   📋 版本: {redis_version}")
        logger.info(f"   💾 内存使用: {used_memory}")
        logger.info(f"   👥 连接数: {connected_clients}")
        
        return {
            "healthy": True,
            "connection_info": connection_info,
            "connection_time": connection_time,
            "version": redis_version,
            "used_memory": used_memory,
            "connected_clients": connected_clients,
            "ping_result": ping_result
        }
        
    except Exception as e:
        logger.error(f"❌ Redis 连接失败")
        logger.error(f"   📍 主机: {settings.redis.host}:{settings.redis.port}")
        logger.error(f"   🔐 密码: {'已设置' if settings.redis.password else '未设置'}")
        logger.error(f"   ❗ 错误: {str(e)}")
        
        return {
            "healthy": False,
            "connection_info": connection_info,
            "error": str(e)
        }


async def check_http_service_health(url: str, expected_status: int = 200) -> Dict[str, Any]:
    """检查 HTTP 服务健康状态"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                return {
                    "status_code": response.status,
                    "healthy": response.status == expected_status,
                    "response_time": response.headers.get("X-Response-Time"),
                    "content_type": response.headers.get("Content-Type")
                }
    except Exception as e:
        logger.debug(f"HTTP 服务健康检查失败: {e}")
        return {"healthy": False, "error": str(e)}


# 便捷函数

def create_oidc_health_checker() -> StartupHealthChecker:
    """创建 OIDC 服务健康检查器"""
    checker = StartupHealthChecker("OIDC Server")
    
    # 添加 PostgreSQL 依赖检查
    checker.add_dependency(DependencyConfig(
        name="postgresql",
        check_func=check_postgresql_health,
        timeout=10,
        required=False,  # OIDC 可以在无数据库模式下运行
        retry_count=3,
        retry_delay=2.0
    ))
    
    # 添加 Redis 依赖检查
    checker.add_dependency(DependencyConfig(
        name="redis",
        check_func=check_redis_health,
        timeout=10,
        required=False,  # OIDC 可以在无缓存模式下运行
        retry_count=3,
        retry_delay=1.0
    ))
    
    return checker


def create_server_health_checker() -> StartupHealthChecker:
    """创建 Server 服务健康检查器"""
    checker = StartupHealthChecker("PhoenixCoder Server")
    
    # 添加 PostgreSQL 依赖检查
    checker.add_dependency(DependencyConfig(
        name="postgresql",
        check_func=check_postgresql_health,
        timeout=10,
        required=False,  # Server 可以在无数据库模式下运行
        retry_count=3,
        retry_delay=2.0
    ))
    
    # 添加 Redis 依赖检查
    checker.add_dependency(DependencyConfig(
        name="redis",
        check_func=check_redis_health,
        timeout=10,
        required=False,  # Server 可以在无 Redis 模式下运行
        retry_count=3,
        retry_delay=2.0
    ))
    
    return checker