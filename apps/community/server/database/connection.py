"""
数据库连接模块
提供FastAPI依赖注入的数据库会话
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from shared.container import get_database_manager
from database.base import DatabaseManager


async def get_session(
    db_manager: DatabaseManager = Depends(get_database_manager)
) -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI依赖注入：获取数据库会话
    
    Args:
        db_manager: 数据库管理器
        
    Yields:
        AsyncSession: 数据库会话
    """
    async with db_manager.get_session() as session:
        yield session


async def get_transaction(
    db_manager: DatabaseManager = Depends(get_database_manager)
) -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI依赖注入：获取事务会话
    
    Args:
        db_manager: 数据库管理器
        
    Yields:
        AsyncSession: 事务会话
    """
    async with db_manager.transaction() as session:
        yield session