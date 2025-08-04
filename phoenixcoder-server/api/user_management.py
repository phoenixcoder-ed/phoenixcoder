from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from services.auth_service import AuthService
from utils.jwt_helper import decode_jwt_token
from fastapi.security import OAuth2AuthorizationCodeBearer
from config.settings import settings

router = APIRouter()
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{settings.OIDC_ISSUER}/authorize",
    tokenUrl=f"{settings.OIDC_ISSUER}/token"
)

# 定义用户模型
class UserModel(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    user_type: str

# 定义创建用户请求模型
class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    user_type: str

# 定义更新用户请求模型
class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    user_type: Optional[str] = None
    password: Optional[str] = None

@router.get("/users", response_model=List[UserModel])
async def get_users(token: str = Depends(oauth2_scheme)):
    """获取所有用户列表"""
    # 实际应用中应该根据权限过滤用户
    # 这里模拟获取用户列表
    users = [
        {
            "id": "1",
            "name": "Admin User",
            "email": "admin@example.com",
            "phone": "13800138000",
            "user_type": "admin"
        },
        {
            "id": "2",
            "name": "Merchant User",
            "email": "merchant@example.com",
            "phone": "13900139000",
            "user_type": "merchant"
        },
        {
            "id": "3",
            "name": "Programmer User",
            "email": "programmer@example.com",
            "phone": "13700137000",
            "user_type": "programmer"
        }
    ]
    return users

@router.get("/users/{user_id}", response_model=UserModel)
async def get_user(user_id: str, token: str = Depends(oauth2_scheme)):
    """获取指定用户详情"""
    # 实际应用中应该查询数据库
    # 这里模拟获取用户
    users = await get_users(token)
    for user in users:
        if user["id"] == user_id:
            return user
    raise HTTPException(status_code=404, detail="用户不存在")

@router.post("/users", response_model=UserModel)
async def create_user(user_data: CreateUserRequest, token: str = Depends(oauth2_scheme)):
    """创建新用户"""
    # 实际应用中应该检查权限和保存到数据库
    # 这里模拟创建用户
    existing_user = await AuthService.check_user_exists(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    user_info = await AuthService.create_user(user_data.dict())
    return user_info

@router.put("/users/{user_id}", response_model=UserModel)
async def update_user(user_id: str, user_data: UpdateUserRequest, token: str = Depends(oauth2_scheme)):
    """更新用户信息"""
    # 实际应用中应该查询并更新数据库
    # 这里模拟更新用户
    users = await get_users(token)
    for user in users:
        if user["id"] == user_id:
            if user_data.name is not None:
                user["name"] = user_data.name
            if user_data.phone is not None:
                user["phone"] = user_data.phone
            if user_data.user_type is not None:
                user["user_type"] = user_data.user_type
            return user
    raise HTTPException(status_code=404, detail="用户不存在")

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, token: str = Depends(oauth2_scheme)):
    """删除用户"""
    # 实际应用中应该查询并删除数据库中的用户
    # 这里模拟删除用户
    return {"message": "用户删除成功"}