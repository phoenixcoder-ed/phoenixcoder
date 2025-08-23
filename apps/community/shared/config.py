#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
共享配置模块

提供统一的配置管理功能
"""

import os
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class Settings:
    """
    应用配置类
    """
    # 数据库配置
    database_url: str = "postgresql://localhost:5432/phoenixcoder"
    
    # Redis 配置
    redis_url: str = "redis://localhost:6379/0"
    
    # 服务配置
    debug: bool = False
    log_level: str = "INFO"
    
    # 外部服务配置
    external_services: Dict[str, str] = None
    
    def __post_init__(self):
        if self.external_services is None:
            self.external_services = {}
        
        # 从环境变量加载配置
        self.database_url = os.getenv("DATABASE_URL", self.database_url)
        self.redis_url = os.getenv("REDIS_URL", self.redis_url)
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.log_level = os.getenv("LOG_LEVEL", self.log_level)


# 全局配置实例
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    获取应用配置
    
    Returns:
        配置实例
    """
    global _settings
    
    if _settings is None:
        _settings = Settings()
    
    return _settings


def update_settings(**kwargs) -> Settings:
    """
    更新配置
    
    Args:
        **kwargs: 要更新的配置项
    
    Returns:
        更新后的配置实例
    """
    global _settings
    
    if _settings is None:
        _settings = Settings()
    
    for key, value in kwargs.items():
        if hasattr(_settings, key):
            setattr(_settings, key, value)
    
    return _settings