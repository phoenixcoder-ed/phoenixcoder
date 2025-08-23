"""
统一数据校验状态处理机制
提供前后端一致的数据校验状态处理
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union, Callable, Awaitable
from datetime import datetime
from dataclasses import dataclass, field
from pydantic import BaseModel, Field, validator
import re
import asyncio
from functools import wraps


class ValidationStatus(str, Enum):
    """校验状态枚举"""
    PENDING = "pending"
    VALIDATING = "validating"
    VALID = "valid"
    INVALID = "invalid"
    SKIPPED = "skipped"


class ValidationSeverity(str, Enum):
    """校验严重程度枚举"""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationErrorType(str, Enum):
    """校验错误类型枚举"""
    REQUIRED = "required"
    FORMAT = "format"
    LENGTH = "length"
    RANGE = "range"
    PATTERN = "pattern"
    UNIQUE = "unique"
    CUSTOM = "custom"
    NETWORK = "network"
    PERMISSION = "permission"
    BUSINESS = "business"
    UNKNOWN = "unknown"


class BackendExceptionState(str, Enum):
    """后端异常状态枚举"""
    DATABASE_UNAVAILABLE = "database_unavailable"
    EXTERNAL_SERVICE_DOWN = "external_service_down"
    RATE_LIMITED = "rate_limited"
    MAINTENANCE_MODE = "maintenance_mode"
    RESOURCE_EXHAUSTED = "resource_exhausted"
    DEPENDENCY_FAILURE = "dependency_failure"


@dataclass
class ValidationError:
    """校验错误数据类"""
    type: ValidationErrorType
    severity: ValidationSeverity
    field: str
    message: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    source: str = "server"
    code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


@dataclass
class ValidationResult:
    """校验结果数据类"""
    is_valid: bool
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class FieldValidationState:
    """字段校验状态"""
    status: ValidationStatus = ValidationStatus.PENDING
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)
    last_value: Any = None
    validated_at: Optional[str] = None


@dataclass
class FormValidationState:
    """表单校验状态"""
    status: ValidationStatus = ValidationStatus.PENDING
    fields: Dict[str, FieldValidationState] = field(default_factory=dict)
    global_errors: List[ValidationError] = field(default_factory=list)
    validated_at: Optional[str] = None


class ValidationRule:
    """校验规则基类"""
    
    def __init__(
        self,
        error_type: ValidationErrorType,
        message: str,
        severity: ValidationSeverity = ValidationSeverity.ERROR,
        code: Optional[str] = None
    ):
        self.error_type = error_type
        self.message = message
        self.severity = severity
        self.code = code
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        """执行校验逻辑，子类需要实现此方法"""
        raise NotImplementedError
    
    def create_error(self, field: str, details: Optional[Dict[str, Any]] = None) -> ValidationError:
        """创建校验错误"""
        return ValidationError(
            type=self.error_type,
            severity=self.severity,
            field=field,
            message=self.message,
            code=self.code,
            details=details
        )


class RequiredRule(ValidationRule):
    """必填校验规则"""
    
    def __init__(self, message: str = "此字段为必填项"):
        super().__init__(ValidationErrorType.REQUIRED, message)
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            return value.strip() != ""
        if isinstance(value, (list, dict)):
            return len(value) > 0
        return True


class EmailRule(ValidationRule):
    """邮箱格式校验规则"""
    
    def __init__(self, message: str = "请输入有效的邮箱地址"):
        super().__init__(ValidationErrorType.FORMAT, message)
        self.email_pattern = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if not value:
            return True
        return bool(self.email_pattern.match(str(value)))


class PhoneRule(ValidationRule):
    """手机号格式校验规则"""
    
    def __init__(self, message: str = "请输入有效的手机号码"):
        super().__init__(ValidationErrorType.FORMAT, message)
        self.phone_pattern = re.compile(r'^1[3-9]\d{9}$')
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if not value:
            return True
        return bool(self.phone_pattern.match(str(value)))


class LengthRule(ValidationRule):
    """长度校验规则"""
    
    def __init__(
        self,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
        message: Optional[str] = None
    ):
        self.min_length = min_length
        self.max_length = max_length
        
        if not message:
            if min_length and max_length:
                message = f"长度必须在{min_length}到{max_length}个字符之间"
            elif min_length:
                message = f"最少需要{min_length}个字符"
            elif max_length:
                message = f"最多允许{max_length}个字符"
            else:
                message = "长度不符合要求"
        
        super().__init__(ValidationErrorType.LENGTH, message)
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if not value:
            return True
        
        length = len(str(value))
        
        if self.min_length and length < self.min_length:
            return False
        if self.max_length and length > self.max_length:
            return False
        
        return True


class RangeRule(ValidationRule):
    """数值范围校验规则"""
    
    def __init__(
        self,
        min_value: Optional[Union[int, float]] = None,
        max_value: Optional[Union[int, float]] = None,
        message: Optional[str] = None
    ):
        self.min_value = min_value
        self.max_value = max_value
        
        if not message:
            if min_value is not None and max_value is not None:
                message = f"值必须在{min_value}到{max_value}之间"
            elif min_value is not None:
                message = f"值不能小于{min_value}"
            elif max_value is not None:
                message = f"值不能大于{max_value}"
            else:
                message = "值不在有效范围内"
        
        super().__init__(ValidationErrorType.RANGE, message)
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if value is None:
            return True
        
        try:
            num_value = float(value)
        except (ValueError, TypeError):
            return False
        
        if self.min_value is not None and num_value < self.min_value:
            return False
        if self.max_value is not None and num_value > self.max_value:
            return False
        
        return True


class PatternRule(ValidationRule):
    """正则表达式校验规则"""
    
    def __init__(self, pattern: str, message: str = "格式不正确"):
        super().__init__(ValidationErrorType.PATTERN, message)
        self.pattern = re.compile(pattern)
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if not value:
            return True
        return bool(self.pattern.match(str(value)))


class UniqueRule(ValidationRule):
    """唯一性校验规则"""
    
    def __init__(
        self,
        check_function: Callable[[Any, Optional[Dict[str, Any]]], Awaitable[bool]],
        message: str = "该值已存在"
    ):
        super().__init__(ValidationErrorType.UNIQUE, message)
        self.check_function = check_function
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        if not value:
            return True
        return await self.check_function(value, context)


class CustomRule(ValidationRule):
    """自定义校验规则"""
    
    def __init__(
        self,
        validator_function: Callable[[Any, Optional[Dict[str, Any]]], Awaitable[bool]],
        message: str,
        error_type: ValidationErrorType = ValidationErrorType.CUSTOM
    ):
        super().__init__(error_type, message)
        self.validator_function = validator_function
    
    async def validate(self, value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        return await self.validator_function(value, context)


@dataclass
class ExceptionHandlingConfig:
    """异常处理配置"""
    skip_validation: bool = False
    fallback_message: str = ""
    retry_config: Optional[Dict[str, Any]] = None


class ValidationManager:
    """统一校验管理器"""
    
    def __init__(self):
        self.current_exception_states: List[BackendExceptionState] = []
        self.exception_config: Dict[BackendExceptionState, ExceptionHandlingConfig] = {
            BackendExceptionState.DATABASE_UNAVAILABLE: ExceptionHandlingConfig(
                skip_validation=True,
                fallback_message="数据库暂时不可用，请稍后重试"
            ),
            BackendExceptionState.EXTERNAL_SERVICE_DOWN: ExceptionHandlingConfig(
                skip_validation=True,
                fallback_message="外部服务暂时不可用，请稍后重试"
            ),
            BackendExceptionState.RATE_LIMITED: ExceptionHandlingConfig(
                skip_validation=True,
                fallback_message="请求过于频繁，请稍后重试"
            ),
            BackendExceptionState.MAINTENANCE_MODE: ExceptionHandlingConfig(
                skip_validation=True,
                fallback_message="系统正在维护中，请稍后访问"
            ),
            BackendExceptionState.RESOURCE_EXHAUSTED: ExceptionHandlingConfig(
                skip_validation=True,
                fallback_message="系统资源不足，请稍后重试"
            ),
            BackendExceptionState.DEPENDENCY_FAILURE: ExceptionHandlingConfig(
                skip_validation=True,
                fallback_message="依赖服务异常，请稍后重试"
            ),
        }
    
    def add_exception_state(self, state: BackendExceptionState):
        """添加异常状态"""
        if state not in self.current_exception_states:
            self.current_exception_states.append(state)
    
    def remove_exception_state(self, state: BackendExceptionState):
        """移除异常状态"""
        if state in self.current_exception_states:
            self.current_exception_states.remove(state)
    
    def clear_exception_states(self):
        """清除所有异常状态"""
        self.current_exception_states.clear()
    
    def should_skip_validation(self, field_name: Optional[str] = None) -> bool:
        """检查是否应该跳过校验"""
        for state in self.current_exception_states:
            config = self.exception_config.get(state)
            if config and config.skip_validation:
                return True
        return False
    
    async def validate_field(
        self,
        field_name: str,
        value: Any,
        rules: List[ValidationRule],
        context: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """校验单个字段"""
        if self.should_skip_validation(field_name):
            return ValidationResult(is_valid=True)
        
        errors = []
        warnings = []
        
        for rule in rules:
            try:
                is_valid = await rule.validate(value, context)
                if not is_valid:
                    error = rule.create_error(field_name)
                    if error.severity == ValidationSeverity.ERROR:
                        errors.append(error)
                    else:
                        warnings.append(error)
            except Exception as e:
                error = ValidationError(
                    type=ValidationErrorType.UNKNOWN,
                    severity=ValidationSeverity.ERROR,
                    field=field_name,
                    message=f"校验过程中发生错误: {str(e)}",
                    details={"original_error": str(e)}
                )
                errors.append(error)
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    async def validate_form(
        self,
        form_data: Dict[str, Any],
        field_rules: Dict[str, List[ValidationRule]],
        context: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """校验整个表单"""
        if self.should_skip_validation():
            return ValidationResult(is_valid=True)
        
        all_errors = []
        all_warnings = []
        
        # 并发校验所有字段
        validation_tasks = []
        for field_name, rules in field_rules.items():
            value = form_data.get(field_name)
            task = self.validate_field(field_name, value, rules, context)
            validation_tasks.append(task)
        
        results = await asyncio.gather(*validation_tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, ValidationResult):
                all_errors.extend(result.errors)
                all_warnings.extend(result.warnings)
            elif isinstance(result, Exception):
                error = ValidationError(
                    type=ValidationErrorType.UNKNOWN,
                    severity=ValidationSeverity.ERROR,
                    field="unknown",
                    message=f"校验过程中发生异常: {str(result)}"
                )
                all_errors.append(error)
        
        return ValidationResult(
            is_valid=len(all_errors) == 0,
            errors=all_errors,
            warnings=all_warnings
        )


# 全局校验管理器实例
validation_manager = ValidationManager()


def handle_validation_exceptions(exception_states: List[BackendExceptionState]):
    """装饰器：处理校验异常状态"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 添加异常状态
            for state in exception_states:
                validation_manager.add_exception_state(state)
            
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                # 移除异常状态
                for state in exception_states:
                    validation_manager.remove_exception_state(state)
        
        return wrapper
    return decorator


# 常用校验规则工厂函数
def required(message: str = "此字段为必填项") -> RequiredRule:
    """创建必填校验规则"""
    return RequiredRule(message)


def email(message: str = "请输入有效的邮箱地址") -> EmailRule:
    """创建邮箱校验规则"""
    return EmailRule(message)


def phone(message: str = "请输入有效的手机号码") -> PhoneRule:
    """创建手机号校验规则"""
    return PhoneRule(message)


def length(
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    message: Optional[str] = None
) -> LengthRule:
    """创建长度校验规则"""
    return LengthRule(min_length, max_length, message)


def range_rule(
    min_value: Optional[Union[int, float]] = None,
    max_value: Optional[Union[int, float]] = None,
    message: Optional[str] = None
) -> RangeRule:
    """创建范围校验规则"""
    return RangeRule(min_value, max_value, message)


def pattern(pattern_str: str, message: str = "格式不正确") -> PatternRule:
    """创建正则表达式校验规则"""
    return PatternRule(pattern_str, message)


def unique(
    check_function: Callable[[Any, Optional[Dict[str, Any]]], Awaitable[bool]],
    message: str = "该值已存在"
) -> UniqueRule:
    """创建唯一性校验规则"""
    return UniqueRule(check_function, message)


def custom(
    validator_function: Callable[[Any, Optional[Dict[str, Any]]], Awaitable[bool]],
    message: str,
    error_type: ValidationErrorType = ValidationErrorType.CUSTOM
) -> CustomRule:
    """创建自定义校验规则"""
    return CustomRule(validator_function, message, error_type)


# Pydantic 集成
class ValidationErrorResponse(BaseModel):
    """校验错误响应模型"""
    type: ValidationErrorType
    severity: ValidationSeverity
    field: str
    message: str
    timestamp: str
    source: str = "server"
    code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ValidationResultResponse(BaseModel):
    """校验结果响应模型"""
    is_valid: bool
    errors: List[ValidationErrorResponse] = Field(default_factory=list)
    warnings: List[ValidationErrorResponse] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None


def validation_error_to_response(error: ValidationError) -> ValidationErrorResponse:
    """将校验错误转换为响应模型"""
    return ValidationErrorResponse(
        type=error.type,
        severity=error.severity,
        field=error.field,
        message=error.message,
        timestamp=error.timestamp,
        source=error.source,
        code=error.code,
        details=error.details
    )


def validation_result_to_response(result: ValidationResult) -> ValidationResultResponse:
    """将校验结果转换为响应模型"""
    return ValidationResultResponse(
        is_valid=result.is_valid,
        errors=[validation_error_to_response(error) for error in result.errors],
        warnings=[validation_error_to_response(warning) for warning in result.warnings],
        metadata=result.metadata
    )