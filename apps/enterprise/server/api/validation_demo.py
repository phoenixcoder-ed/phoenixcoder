"""
统一数据校验状态处理机制演示API
提供前后端一致的数据校验状态处理
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
import asyncio
from datetime import datetime

from shared.validation import (
    ValidationManager,
    ValidationRule,
    ValidationResult,
    ValidationErrorType,
    ValidationSeverity,
    BackendExceptionState,
    validation_manager,
    handle_validation_exceptions,
    required,
    email,
    phone,
    length,
    range_rule,
    pattern,
    unique,
    custom,
    validation_result_to_response,
)

router = APIRouter(prefix="/validation", tags=["validation"])


# 请求模型
class UserRegistrationRequest(BaseModel):
    """用户注册请求模型"""
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱地址")
    phone: Optional[str] = Field(None, description="手机号码")
    password: str = Field(..., description="密码")
    confirm_password: str = Field(..., description="确认密码")
    age: Optional[int] = Field(None, description="年龄")
    bio: Optional[str] = Field(None, description="个人简介")

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('两次输入的密码不一致')
        return v


class FieldValidationRequest(BaseModel):
    """字段校验请求模型"""
    field_name: str = Field(..., description="字段名称")
    value: Any = Field(..., description="字段值")
    context: Optional[Dict[str, Any]] = Field(None, description="校验上下文")


class FormValidationRequest(BaseModel):
    """表单校验请求模型"""
    form_data: Dict[str, Any] = Field(..., description="表单数据")
    context: Optional[Dict[str, Any]] = Field(None, description="校验上下文")


class ExceptionStateRequest(BaseModel):
    """异常状态请求模型"""
    states: List[BackendExceptionState] = Field(..., description="异常状态列表")


# 模拟数据库
fake_users_db = {
    "admin": {"email": "admin@example.com", "phone": "13800138000"},
    "test": {"email": "test@example.com", "phone": "13800138001"},
}


# 异步校验函数
async def check_username_unique(value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
    """检查用户名是否唯一"""
    await asyncio.sleep(0.1)  # 模拟数据库查询延迟
    return str(value).lower() not in fake_users_db


async def check_email_unique(value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
    """检查邮箱是否唯一"""
    await asyncio.sleep(0.1)  # 模拟数据库查询延迟
    email_str = str(value).lower()
    return not any(user["email"].lower() == email_str for user in fake_users_db.values())


async def check_phone_unique(value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
    """检查手机号是否唯一"""
    await asyncio.sleep(0.1)  # 模拟数据库查询延迟
    phone_str = str(value)
    return not any(user["phone"] == phone_str for user in fake_users_db.values())


async def validate_password_strength(value: Any, context: Optional[Dict[str, Any]] = None) -> bool:
    """校验密码强度"""
    password = str(value)
    
    # 检查是否包含大小写字母和数字
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    return has_lower and has_upper and has_digit


# 字段校验规则配置
FIELD_RULES = {
    "username": [
        required("用户名为必填项"),
        length(min_length=3, max_length=20, message="用户名长度必须在3到20个字符之间"),
        pattern(r"^[a-zA-Z0-9_]+$", "用户名只能包含字母、数字和下划线"),
        unique(check_username_unique, "用户名已存在"),
    ],
    "email": [
        required("邮箱为必填项"),
        email("请输入有效的邮箱地址"),
        unique(check_email_unique, "邮箱已被注册"),
    ],
    "phone": [
        phone("请输入有效的手机号码"),
        unique(check_phone_unique, "手机号已被注册"),
    ],
    "password": [
        required("密码为必填项"),
        length(min_length=8, message="密码至少需要8个字符"),
        custom(validate_password_strength, "密码必须包含大小写字母和数字"),
    ],
    "confirm_password": [
        required("请确认密码"),
    ],
    "age": [
        range_rule(min_value=18, max_value=100, message="年龄必须在18到100之间"),
    ],
    "bio": [
        length(max_length=500, message="个人简介最多500个字符"),
    ],
}


@router.post("/field", summary="校验单个字段")
async def validate_field_endpoint(request: FieldValidationRequest):
    """校验单个字段"""
    try:
        field_name = request.field_name
        value = request.value
        context = request.context or {}
        
        # 获取字段校验规则
        rules = FIELD_RULES.get(field_name, [])
        
        # 执行校验
        result = await validation_manager.validate_field(
            field_name, value, rules, context
        )
        
        return validation_result_to_response(result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"字段校验失败: {str(e)}")


@router.post("/form", summary="校验整个表单")
async def validate_form_endpoint(request: FormValidationRequest):
    """校验整个表单"""
    try:
        form_data = request.form_data
        context = request.context or {}
        
        # 添加确认密码校验逻辑
        if "confirm_password" in form_data and "password" in form_data:
            async def check_password_match(value, ctx):
                return value == form_data.get("password")
            
            confirm_password_rule = custom(
                check_password_match,
                "两次输入的密码不一致"
            )
            FIELD_RULES["confirm_password"] = [
                required("请确认密码"),
                confirm_password_rule,
            ]
        
        # 执行表单校验
        result = await validation_manager.validate_form(
            form_data, FIELD_RULES, context
        )
        
        return validation_result_to_response(result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"表单校验失败: {str(e)}")


@router.post("/register", summary="用户注册（完整校验流程）")
async def register_user(request: UserRegistrationRequest):
    """用户注册，演示完整的校验流程"""
    try:
        # 转换为字典格式
        form_data = request.dict()
        
        # 执行表单校验
        result = await validation_manager.validate_form(
            form_data, FIELD_RULES, {}
        )
        
        if not result.is_valid:
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "表单校验失败",
                    "validation_result": validation_result_to_response(result).dict()
                }
            )
        
        # 模拟用户创建
        username = request.username.lower()
        fake_users_db[username] = {
            "email": request.email.lower(),
            "phone": request.phone or "",
            "created_at": datetime.now().isoformat(),
        }
        
        return {
            "message": "用户注册成功",
            "user_id": username,
            "validation_result": validation_result_to_response(result).dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"用户注册失败: {str(e)}")


@router.post("/exception-states", summary="设置异常状态")
async def set_exception_states(request: ExceptionStateRequest):
    """设置后端异常状态"""
    try:
        # 清除现有异常状态
        validation_manager.clear_exception_states()
        
        # 添加新的异常状态
        for state in request.states:
            validation_manager.add_exception_state(state)
        
        return {
            "message": "异常状态设置成功",
            "current_states": validation_manager.current_exception_states,
            "skip_validation": validation_manager.should_skip_validation()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"设置异常状态失败: {str(e)}")


@router.get("/exception-states", summary="获取当前异常状态")
async def get_exception_states():
    """获取当前异常状态"""
    return {
        "current_states": validation_manager.current_exception_states,
        "skip_validation": validation_manager.should_skip_validation(),
        "available_states": [state.value for state in BackendExceptionState]
    }


@router.delete("/exception-states", summary="清除异常状态")
async def clear_exception_states():
    """清除所有异常状态"""
    validation_manager.clear_exception_states()
    return {
        "message": "异常状态已清除",
        "current_states": validation_manager.current_exception_states
    }


@router.get("/unique-check/{field_name}", summary="检查字段唯一性")
async def check_field_unique(field_name: str, value: str):
    """检查字段值的唯一性"""
    try:
        check_functions = {
            "username": check_username_unique,
            "email": check_email_unique,
            "phone": check_phone_unique,
        }
        
        check_function = check_functions.get(field_name)
        if not check_function:
            raise HTTPException(status_code=400, detail=f"不支持的字段: {field_name}")
        
        is_unique = await check_function(value)
        
        return {
            "field_name": field_name,
            "value": value,
            "is_unique": is_unique,
            "message": "可以使用" if is_unique else f"{field_name}已存在"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"唯一性检查失败: {str(e)}")


@router.get("/demo-data", summary="获取演示数据")
async def get_demo_data():
    """获取演示数据"""
    return {
        "existing_users": list(fake_users_db.keys()),
        "field_rules": {
            field_name: [
                {
                    "type": rule.error_type.value,
                    "message": rule.message,
                    "severity": rule.severity.value
                }
                for rule in rules
            ]
            for field_name, rules in FIELD_RULES.items()
        },
        "exception_states": [state.value for state in BackendExceptionState]
    }


# 模拟异常状态的端点
@router.post("/simulate/database-error", summary="模拟数据库异常")
@handle_validation_exceptions([BackendExceptionState.DATABASE_UNAVAILABLE])
async def simulate_database_error():
    """模拟数据库异常状态"""
    return {"message": "数据库异常状态已激活，校验将被跳过"}


@router.post("/simulate/service-down", summary="模拟外部服务异常")
@handle_validation_exceptions([BackendExceptionState.EXTERNAL_SERVICE_DOWN])
async def simulate_service_down():
    """模拟外部服务异常状态"""
    return {"message": "外部服务异常状态已激活，校验将被跳过"}


@router.post("/simulate/rate-limit", summary="模拟限流异常")
@handle_validation_exceptions([BackendExceptionState.RATE_LIMITED])
async def simulate_rate_limit():
    """模拟限流异常状态"""
    return {"message": "限流异常状态已激活，校验将被跳过"}


@router.post("/simulate/maintenance", summary="模拟维护模式")
@handle_validation_exceptions([BackendExceptionState.MAINTENANCE_MODE])
async def simulate_maintenance():
    """模拟维护模式异常状态"""
    return {"message": "维护模式已激活，校验将被跳过"}


@router.get("/health", summary="健康检查")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "validation_manager": {
            "exception_states": validation_manager.current_exception_states,
            "skip_validation": validation_manager.should_skip_validation()
        }
    }