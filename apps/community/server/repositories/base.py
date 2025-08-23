"""
数据访问层基础接口
实现依赖倒置原则，业务层依赖抽象而非具体实现
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Dict, Any
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class BaseRepository(ABC, Generic[T]):
    """基础仓储接口"""
    
    @abstractmethod
    async def create(self, entity: T) -> T:
        """创建实体"""
        pass
    
    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """根据ID获取实体"""
        pass
    
    @abstractmethod
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[T]:
        """更新实体"""
        pass
    
    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """删除实体"""
        pass
    
    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[T]:
        """列表查询"""
        pass
    
    @abstractmethod
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计数查询"""
        pass

class UserRepository(BaseRepository[T]):
    """用户仓储接口"""
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[T]:
        """根据邮箱获取用户"""
        pass
    
    @abstractmethod
    async def get_by_phone(self, phone: str) -> Optional[T]:
        """根据手机号获取用户"""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[T]:
        """根据用户名获取用户"""
        pass
    
    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """检查邮箱是否存在"""
        pass
    
    @abstractmethod
    async def exists_by_phone(self, phone: str) -> bool:
        """检查手机号是否存在"""
        pass
    
    @abstractmethod
    async def update_last_login(self, user_id: str) -> bool:
        """更新最后登录时间"""
        pass