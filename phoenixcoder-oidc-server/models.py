from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal, TypeAlias
import re

# 用户类型枚举
UserType: TypeAlias = Literal['programmer', 'merchant', 'admin']

class User(BaseModel):
    sub: str = Field(..., description="用户唯一标识符")
    email: Optional[EmailStr] = Field(None, description="用户邮箱")
    phone: Optional[str] = Field(None, description="用户手机号")
    name: str = Field(..., description="用户名称")
    password: str = Field(..., description="用户密码")
    user_type: UserType = Field(..., description="用户类型: programmer(程序员), merchant(入驻商家), admin(平台运营)")
    avatar: Optional[str] = Field(None, description="用户头像URL")
    is_active: bool = Field(True, description="用户是否激活")
    created_at: int = Field(..., description="创建时间戳")
    updated_at: int = Field(..., description="更新时间戳")

    @validator('email', 'phone')
    def email_or_phone_required(cls, v, values, **kwargs):
        if 'email' in kwargs and 'phone' in kwargs:
            if not v and not values.get('phone'):
                raise ValueError('邮箱和手机号至少需要填写一个')
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