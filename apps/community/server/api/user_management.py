from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from services.auth_service import AuthService
from utils.jwt_helper import decode_jwt_token
from logging_config import logger

router = APIRouter()

# 依赖项：获取当前用户
async def get_current_user(token: str = Depends(decode_jwt_token)):
    """获取当前认证用户

    Args:
        token: JWT令牌

    Returns:
        用户信息
    """
    return token

# 依赖项：检查管理员权限
async def check_admin_permissions(current_user: Dict[str, Any] = Depends(get_current_user)):
    """检查用户是否具有管理员权限

    Args:
        current_user: 当前认证用户信息

    Returns:
        用户信息

    Raises:
        HTTPException: 如果用户不是管理员
    """
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user

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
async def get_users(current_user: Dict[str, Any] = Depends(check_admin_permissions)):
    """获取所有用户列表

    Args:
        current_user: 当前认证用户信息

    Returns:
        用户列表
    """
    try:
        # 实际应用中应该查询数据库
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
    except Exception as e:
        logger.error(f"获取用户列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户列表失败: {str(e)}"
        )

@router.get("/users/{user_id}", response_model=UserModel)
async def get_user(user_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取指定用户详情

    Args:
        user_id: 用户ID
        current_user: 当前认证用户信息

    Returns:
        用户详情
    """
    try:
        # 实际应用中应该查询数据库
        # 这里模拟获取用户
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
        
        for user in users:
            if user["id"] == user_id:
                # 检查权限：管理员可以查看所有用户，普通用户只能查看自己
                if current_user.get("user_type") != "admin" and current_user.get("sub") != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="无权访问此用户信息"
                    )
                return user
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"获取用户详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户详情失败: {str(e)}"
        )

@router.post("/users", response_model=UserModel)
async def create_user(user_data: CreateUserRequest, current_user: Dict[str, Any] = Depends(check_admin_permissions)):
    """创建新用户

    Args:
        user_data: 创建用户的请求数据
        current_user: 当前认证用户信息

    Returns:
        创建的用户信息
    """
    try:
        # 检查用户是否已存在
        existing_user = await AuthService.check_user_exists(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

        # 创建新用户
        user_info = await AuthService.create_user(user_data.dict())
        logger.info(f"管理员 {current_user.get('name')} 创建了新用户: {user_info.get('name')}")
        return user_info
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"创建用户失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建用户失败: {str(e)}"
        )

@router.put("/users/{user_id}", response_model=UserModel)
async def update_user(user_id: str, user_data: UpdateUserRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """更新用户信息

    Args:
        user_id: 用户ID
        user_data: 更新用户的请求数据
        current_user: 当前认证用户信息

    Returns:
        更新后的用户信息
    """
    try:
        # 实际应用中应该查询数据库
        # 这里模拟获取用户
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
        
        for user in users:
            if user["id"] == user_id:
                # 检查权限：管理员可以更新所有用户，普通用户只能更新自己
                if current_user.get("user_type") != "admin" and current_user.get("sub") != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="无权更新此用户信息"
                    )
                
                # 更新用户信息
                if user_data.name is not None:
                    user["name"] = user_data.name
                if user_data.phone is not None:
                    user["phone"] = user_data.phone
                
                # 只有管理员可以更新用户类型
                if user_data.user_type is not None:
                    if current_user.get("user_type") != "admin":
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="只有管理员可以更新用户类型"
                        )
                    user["user_type"] = user_data.user_type
                
                # 更新密码（实际应用中应该加密）
                if user_data.password is not None:
                    # 这里不实际更新密码，仅作演示
                    pass
                
                logger.info(f"用户 {current_user.get('name')} 更新了用户 {user_id} 的信息")
                return user
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"更新用户信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新用户信息失败: {str(e)}"
        )

# 定义删除用户响应模型
class DeleteUserResponse(BaseModel):
    message: str

@router.delete("/users/{user_id}", response_model=DeleteUserResponse)
async def delete_user(user_id: str, current_user: Dict[str, Any] = Depends(check_admin_permissions)):
    """删除用户

    Args:
        user_id: 用户ID
        current_user: 当前认证用户信息

    Returns:
        包含删除成功消息的响应
    """
    try:
        # 实际应用中应该查询并删除数据库中的用户
        # 这里模拟删除用户
        logger.info(f"管理员 {current_user.get('name')} 删除了用户 {user_id}")
        return {"message": "用户删除成功"}
    except Exception as e:
        logger.error(f"删除用户失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除用户失败: {str(e)}"
        )