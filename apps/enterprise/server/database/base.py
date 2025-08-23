"""
数据库基础配置
使用SQLAlchemy 2.0 + asyncpg实现现代化数据库架构
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging

logger = logging.getLogger(__name__)

# 数据库元数据配置
metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s"
    }
)

class Base(DeclarativeBase):
    """SQLAlchemy 2.0 声明式基类"""
    metadata = metadata

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, database_url: str, **engine_kwargs):
        """
        初始化数据库管理器
        
        Args:
            database_url: 数据库连接URL
            **engine_kwargs: 引擎额外参数
        """
        # 检测是否为SQLite数据库
        is_sqlite = database_url.startswith("sqlite")
        
        if is_sqlite:
            # SQLite配置（不支持连接池）
            default_engine_kwargs = {
                "echo": False,
            }
        else:
            # PostgreSQL等其他数据库配置
            default_engine_kwargs = {
                "echo": False,  # 生产环境关闭SQL日志
                "pool_size": 20,  # 连接池大小
                "max_overflow": 30,  # 最大溢出连接数
                "pool_timeout": 30,  # 连接超时时间
                "pool_recycle": 3600,  # 连接回收时间（1小时）
                "pool_pre_ping": True,  # 连接前ping检查
            }
        
        # 合并用户配置
        engine_config = {**default_engine_kwargs, **engine_kwargs}
        
        # 创建异步引擎
        self.engine = create_async_engine(database_url, **engine_config)
        
        # 创建会话工厂
        self.async_session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False,
        )
        
        logger.info(f"Database engine created with URL: {database_url}")

    async def create_tables(self):
        """创建所有表"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")

    async def drop_tables(self):
        """删除所有表（仅用于测试）"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.warning("All database tables dropped")

    async def close(self):
        """关闭数据库连接"""
        await self.engine.dispose()
        logger.info("Database connections closed")

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """获取数据库会话上下文管理器"""
        async with self.async_session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[AsyncSession, None]:
        """事务上下文管理器"""
        async with self.get_session() as session:
            async with session.begin():
                try:
                    yield session
                except Exception:
                    await session.rollback()
                    raise

# 全局数据库管理器实例
db_manager: DatabaseManager = None

def init_database(database_url: str, **engine_kwargs) -> DatabaseManager:
    """初始化数据库管理器"""
    global db_manager
    db_manager = DatabaseManager(database_url, **engine_kwargs)
    return db_manager

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI依赖注入：获取数据库会话"""
    if not db_manager:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with db_manager.get_session() as session:
        yield session

async def get_db_transaction() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI依赖注入：获取事务会话"""
    if not db_manager:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with db_manager.transaction() as session:
        yield session