from pydantic import BaseModel, EmailStr, Field, validator, root_validator
from typing import Optional, Literal, TypeAlias
from datetime import datetime
from enum import Enum
import re
import uuid

# 用户类型枚举
class UserType(str, Enum):
    PROGRAMMER = "programmer"
    MERCHANT = "merchant"
    ADMIN = "admin"

class BaseTimestampModel(BaseModel):
    """带时间戳的基础模型"""
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BaseEntityModel(BaseTimestampModel):
    """带ID的基础实体模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="唯一标识符")

class ContactInfoMixin(BaseModel):
    """联系信息混入类"""
    email: Optional[EmailStr] = Field(None, description="用户邮箱")
    phone: Optional[str] = Field(None, description="用户手机号")
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('手机号格式不正确')
        return v
    
    @root_validator
    def email_or_phone_required(cls, values):
        email = values.get('email')
        phone = values.get('phone')
        if not email and not phone:
            raise ValueError('邮箱和手机号至少需要填写一个')
        return values

class User(BaseEntityModel, ContactInfoMixin):
    sub: str = Field(..., description="用户唯一标识符")
    name: str = Field(..., min_length=1, max_length=50, description="用户名称")
    password: str = Field(..., min_length=8, description="用户密码")
    user_type: UserType = Field(..., description="用户类型")
    avatar: Optional[str] = Field(None, description="用户头像URL")
    is_active: bool = Field(True, description="用户是否激活")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    login_count: int = Field(default=0, description="登录次数")
    
    @validator('avatar')
    def validate_avatar_url(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('头像必须是有效的URL')
        return v
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('密码必须包含字母')
        if not re.search(r'[0-9]', v):
            raise ValueError('密码必须包含数字')
        return v

class UserCreate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="用户邮箱")
    phone: Optional[str] = Field(None, description="用户手机号")
    name: str = Field(..., description="用户名称")
    password: str = Field(..., description="用户密码")
    user_type: UserType = Field(..., description="用户类型")

    @validator('email', 'phone')
    def email_or_phone_required(cls, v, values, **kwargs):
        if 'email' in kwargs and 'phone' in kwargs:
            if not v and not values.get('phone'):
                raise ValueError('邮箱和手机号至少需要填写一个')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('手机号格式不正确')
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, description="用户名称")
    password: Optional[str] = Field(None, description="用户密码")
    avatar: Optional[str] = Field(None, description="用户头像URL")
    is_active: Optional[bool] = Field(None, description="用户是否激活")

class UserResponse(BaseModel):
    sub: str
    email: EmailStr
    name: str
    user_type: UserType
    avatar: Optional[str]
    is_active: bool
    created_at: int
    updated_at: int

    class Config:
        orm_mode = True

class WechatLoginRequest(BaseModel):
    code: str = Field(..., description="微信登录code")
    user_type: UserType = Field(..., description="用户类型")