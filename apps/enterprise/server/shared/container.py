"""
依赖注入容器
实现控制反转(IoC)和依赖注入(DI)模式
"""

from typing import TypeVar, Type, Dict, Any, Callable, Optional
from functools import lru_cache
import inspect
import logging
from contextlib import asynccontextmanager

from database.base import DatabaseManager
from repositories.user_repository import UserRepository, UserSessionRepository
from repositories.task_repository import TaskRepository
from repositories.skill_repository import SkillRepository
from services.auth_service import AuthService, PasswordService, TokenService
from services.user_service import UserService
from services.task_service import TaskService
from services.skill_service import SkillService
from services.growth_service import GrowthService
from config.settings import Settings

logger = logging.getLogger(__name__)

T = TypeVar('T')


class Container:
    """依赖注入容器"""
    
    def __init__(self):
        self._services: Dict[Type, Any] = {}
        self._singletons: Dict[Type, Any] = {}
        self._factories: Dict[Type, Callable] = {}
        self._initialized = False

    def register_singleton(self, interface: Type[T], implementation: T) -> None:
        """注册单例服务"""
        self._singletons[interface] = implementation

    def register_factory(self, interface: Type[T], factory: Callable[[], T]) -> None:
        """注册工厂方法"""
        self._factories[interface] = factory

    def register_transient(self, interface: Type[T], implementation: Type[T]) -> None:
        """注册瞬态服务"""
        self._services[interface] = implementation

    def get(self, interface: Type[T]) -> T:
        """获取服务实例"""
        # 检查单例
        if interface in self._singletons:
            return self._singletons[interface]
        
        # 检查工厂方法
        if interface in self._factories:
            return self._factories[interface]()
        
        # 检查瞬态服务
        if interface in self._services:
            implementation = self._services[interface]
            return self._create_instance(implementation)
        
        # 尝试自动解析
        return self._create_instance(interface)

    def _create_instance(self, cls: Type[T]) -> T:
        """创建实例并自动注入依赖"""
        signature = inspect.signature(cls.__init__)
        kwargs = {}
        
        for param_name, param in signature.parameters.items():
            if param_name == 'self':
                continue
            
            if param.annotation != inspect.Parameter.empty:
                dependency = self.get(param.annotation)
                kwargs[param_name] = dependency
        
        return cls(**kwargs)

    async def initialize(self) -> None:
        """初始化容器"""
        if self._initialized:
            return
        
        # 初始化配置
        settings = Settings()
        self.register_singleton(Settings, settings)
        
        # 初始化数据库管理器
        db_manager = DatabaseManager(settings.database.async_url)
        try:
            await db_manager.create_tables()
            logger.info("数据库表创建成功")
        except Exception as e:
            logger.warning(f"数据库连接失败，服务将在无数据库模式下启动: {e}")
        self.register_singleton(DatabaseManager, db_manager)
        
        # 注册仓储
        self.register_transient(UserRepository, UserRepository)
        self.register_transient(UserSessionRepository, UserSessionRepository)
        self.register_transient(TaskRepository, TaskRepository)
        self.register_transient(SkillRepository, SkillRepository)
        
        # 注册服务
        password_service = PasswordService()
        self.register_singleton(PasswordService, password_service)
        
        token_service = TokenService()
        self.register_singleton(TokenService, token_service)
        
        self.register_transient(AuthService, AuthService)
        self.register_transient(UserService, UserService)
        self.register_transient(TaskService, TaskService)
        self.register_transient(SkillService, SkillService)
        self.register_transient(GrowthService, GrowthService)
        
        self._initialized = True

    async def cleanup(self) -> None:
        """清理资源"""
        if DatabaseManager in self._singletons:
            db_manager = self._singletons[DatabaseManager]
            await db_manager.close()


# 全局容器实例
_container: Optional[Container] = None


def get_container() -> Container:
    """获取全局容器实例"""
    global _container
    if _container is None:
        _container = Container()
    return _container


@asynccontextmanager
async def container_lifespan():
    """容器生命周期管理"""
    container = get_container()
    try:
        await container.initialize()
        yield container
    finally:
        await container.cleanup()


# FastAPI 依赖注入函数
def get_auth_service() -> AuthService:
    """获取认证服务"""
    return get_container().get(AuthService)


def get_user_service() -> UserService:
    """获取用户服务"""
    return get_container().get(UserService)


def get_task_service() -> TaskService:
    """获取任务服务"""
    return get_container().get(TaskService)


def get_skill_service() -> SkillService:
    """获取技能服务"""
    return get_container().get(SkillService)


def get_growth_service() -> GrowthService:
    """获取成长服务"""
    return get_container().get(GrowthService)


def get_user_repository() -> UserRepository:
    """获取用户仓储"""
    return get_container().get(UserRepository)


def get_user_session_repository() -> UserSessionRepository:
    """获取用户会话仓储"""
    return get_container().get(UserSessionRepository)


def get_task_repository() -> TaskRepository:
    """获取任务仓储"""
    return get_container().get(TaskRepository)


def get_skill_repository() -> SkillRepository:
    """获取技能仓储"""
    return get_container().get(SkillRepository)


def get_database_manager() -> DatabaseManager:
    """获取数据库管理器"""
    return get_container().get(DatabaseManager)


def get_settings() -> Settings:
    """获取配置"""
    return get_container().get(Settings)


@lru_cache()
def get_password_service() -> PasswordService:
    """获取密码服务（缓存）"""
    return get_container().get(PasswordService)


@lru_cache()
def get_token_service() -> TokenService:
    """获取令牌服务（缓存）"""
    return get_container().get(TokenService)