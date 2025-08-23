"""
共享异常类定义
定义应用程序中使用的自定义异常
"""

from typing import Optional, Dict, Any


class BaseApplicationError(Exception):
    """应用程序基础异常类"""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details
        }


class ValidationError(BaseApplicationError):
    """验证错误"""
    pass


class AuthenticationError(BaseApplicationError):
    """认证错误"""
    pass


class AuthorizationError(BaseApplicationError):
    """授权错误"""
    pass


class UserNotFoundError(BaseApplicationError):
    """用户不存在错误"""
    
    def __init__(self, message: str = "用户不存在"):
        super().__init__(message, "USER_NOT_FOUND")


class UserAlreadyExistsError(BaseApplicationError):
    """用户已存在错误"""
    
    def __init__(self, message: str = "用户已存在"):
        super().__init__(message, "USER_ALREADY_EXISTS")


class InvalidCredentialsError(AuthenticationError):
    """无效凭据错误"""
    
    def __init__(self, message: str = "用户名或密码错误"):
        super().__init__(message, "INVALID_CREDENTIALS")


class AccountLockedError(AuthenticationError):
    """账户锁定错误"""
    
    def __init__(self, message: str = "账户已被锁定"):
        super().__init__(message, "ACCOUNT_LOCKED")


class AccountInactiveError(AuthenticationError):
    """账户未激活错误"""
    
    def __init__(self, message: str = "账户未激活"):
        super().__init__(message, "ACCOUNT_INACTIVE")


class TokenExpiredError(AuthenticationError):
    """令牌过期错误"""
    
    def __init__(self, message: str = "令牌已过期"):
        super().__init__(message, "TOKEN_EXPIRED")


class InvalidTokenError(AuthenticationError):
    """无效令牌错误"""
    
    def __init__(self, message: str = "无效令牌"):
        super().__init__(message, "INVALID_TOKEN")


class PermissionDeniedError(AuthorizationError):
    """权限拒绝错误"""
    
    def __init__(self, message: str = "权限不足"):
        super().__init__(message, "PERMISSION_DENIED")


class ResourceNotFoundError(BaseApplicationError):
    """资源不存在错误"""
    
    def __init__(self, message: str = "资源不存在"):
        super().__init__(message, "RESOURCE_NOT_FOUND")


class TaskNotFoundError(BaseApplicationError):
    """任务不存在错误"""
    
    def __init__(self, message: str = "任务不存在"):
        super().__init__(message, "TASK_NOT_FOUND")


class SkillNotFoundError(BaseApplicationError):
    """技能不存在错误"""
    
    def __init__(self, message: str = "技能不存在"):
        super().__init__(message, "SKILL_NOT_FOUND")


class ResourceConflictError(BaseApplicationError):
    """资源冲突错误"""
    
    def __init__(self, message: str = "资源冲突"):
        super().__init__(message, "RESOURCE_CONFLICT")


class DatabaseError(BaseApplicationError):
    """数据库错误"""
    
    def __init__(self, message: str = "数据库操作失败"):
        super().__init__(message, "DATABASE_ERROR")


class ExternalServiceError(BaseApplicationError):
    """外部服务错误"""
    
    def __init__(self, message: str = "外部服务调用失败", service_name: Optional[str] = None):
        details = {"service_name": service_name} if service_name else {}
        super().__init__(message, "EXTERNAL_SERVICE_ERROR", details)


class RateLimitExceededError(BaseApplicationError):
    """频率限制错误"""
    
    def __init__(self, message: str = "请求频率过高", retry_after: Optional[int] = None):
        details = {"retry_after": retry_after} if retry_after else {}
        super().__init__(message, "RATE_LIMIT_EXCEEDED", details)


class ConfigurationError(BaseApplicationError):
    """配置错误"""
    
    def __init__(self, message: str = "配置错误"):
        super().__init__(message, "CONFIGURATION_ERROR")


class BusinessLogicError(BaseApplicationError):
    """业务逻辑错误"""
    
    def __init__(self, message: str = "业务逻辑错误"):
        super().__init__(message, "BUSINESS_LOGIC_ERROR")


class FileOperationError(BaseApplicationError):
    """文件操作错误"""
    
    def __init__(self, message: str = "文件操作失败"):
        super().__init__(message, "FILE_OPERATION_ERROR")


class NetworkError(BaseApplicationError):
    """网络错误"""
    
    def __init__(self, message: str = "网络连接失败"):
        super().__init__(message, "NETWORK_ERROR")


class TimeoutError(BaseApplicationError):
    """超时错误"""
    
    def __init__(self, message: str = "操作超时"):
        super().__init__(message, "TIMEOUT_ERROR")


class SerializationError(BaseApplicationError):
    """序列化错误"""
    
    def __init__(self, message: str = "数据序列化失败"):
        super().__init__(message, "SERIALIZATION_ERROR")


class DeserializationError(BaseApplicationError):
    """反序列化错误"""
    
    def __init__(self, message: str = "数据反序列化失败"):
        super().__init__(message, "DESERIALIZATION_ERROR")


# 异常映射字典，用于快速查找异常类型
EXCEPTION_MAP = {
    "USER_NOT_FOUND": UserNotFoundError,
    "USER_ALREADY_EXISTS": UserAlreadyExistsError,
    "INVALID_CREDENTIALS": InvalidCredentialsError,
    "ACCOUNT_LOCKED": AccountLockedError,
    "TOKEN_EXPIRED": TokenExpiredError,
    "INVALID_TOKEN": InvalidTokenError,
    "PERMISSION_DENIED": PermissionDeniedError,
    "RESOURCE_NOT_FOUND": ResourceNotFoundError,
    "RESOURCE_CONFLICT": ResourceConflictError,
    "DATABASE_ERROR": DatabaseError,
    "EXTERNAL_SERVICE_ERROR": ExternalServiceError,
    "RATE_LIMIT_EXCEEDED": RateLimitExceededError,
    "CONFIGURATION_ERROR": ConfigurationError,
    "BUSINESS_LOGIC_ERROR": BusinessLogicError,
    "FILE_OPERATION_ERROR": FileOperationError,
    "NETWORK_ERROR": NetworkError,
    "TIMEOUT_ERROR": TimeoutError,
    "SERIALIZATION_ERROR": SerializationError,
    "DESERIALIZATION_ERROR": DeserializationError,
}


def create_exception(error_code: str, message: str, **kwargs) -> BaseApplicationError:
    """
    根据错误代码创建异常实例
    
    Args:
        error_code: 错误代码
        message: 错误消息
        **kwargs: 其他参数
    
    Returns:
        异常实例
    """
    exception_class = EXCEPTION_MAP.get(error_code, BaseApplicationError)
    return exception_class(message, **kwargs)