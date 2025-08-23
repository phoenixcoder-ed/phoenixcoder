#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OIDC Server 配置模块
"""

import os
from typing import Optional
from functools import lru_cache


class DatabaseSettings:
    """数据库配置"""
    def __init__(self):
        self.host = os.getenv("POSTGRES_HOST", "localhost")
        self.port = int(os.getenv("POSTGRES_PORT", "5432"))
        self.db = os.getenv("POSTGRES_DB", "phoenixcoder")
        self.user = os.getenv("POSTGRES_USER", "postgres")
        self.password = os.getenv("POSTGRES_PASSWORD", "")


class RedisSettings:
    """Redis 配置"""
    def __init__(self):
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", "6379"))
        self.password = os.getenv("REDIS_PASSWORD")
        self.db = int(os.getenv("REDIS_DB", "0"))


class OIDCSettings:
    """OIDC 配置"""
    def __init__(self):
        self.issuer = os.getenv("OIDC_ISSUER", "http://localhost:8001")
        self.jwt_secret = os.getenv("OIDC_JWT_SECRET", "your-jwt-secret-key")
        self.jwt_algorithm = os.getenv("OIDC_JWT_ALGORITHM", "HS256")


class WechatSettings:
    """微信配置"""
    def __init__(self):
        self.app_id = os.getenv("WECHAT_APP_ID")
        self.app_secret = os.getenv("WECHAT_APP_SECRET")


class Settings:
    """应用配置"""
    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "PhoenixCoder OIDC Server")
        self.app_version = os.getenv("APP_VERSION", "1.0.0")
        self.app_env = os.getenv("APP_ENV", "development")
        self.debug = os.getenv("APP_DEBUG", "false").lower() == "true"
        self.log_level = os.getenv("APP_LOG_LEVEL", "INFO")
        
        # 嵌套配置
        self.database = DatabaseSettings()
        self.redis = RedisSettings()
        self.oidc = OIDCSettings()
        self.wechat = WechatSettings()


@lru_cache()
def get_settings() -> Settings:
    """获取配置实例（单例模式）"""
    return Settings()