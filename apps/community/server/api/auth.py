from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from services.auth_service import AuthService
from utils.jwt_helper import decode_jwt_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from logging_config import logger

router = APIRouter()
security = HTTPBearer()

class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    password: str

class OIDCCallbackRequest(BaseModel):
    code: str

class RegisterRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    confirm_password: str
    user_type: str = "programmer"

class LogoutRequest(BaseModel):
    token: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """获取当前用户信息"""
    try:
        token = credentials.credentials
        payload = decode_jwt_token(token)
        return payload
    except Exception as e:
        logger.error(f"Token 验证失败: {e}")
        raise HTTPException(status_code=401, detail="无效的认证令牌")

@router.post("/login")
async def login(request: LoginRequest):
    """直接登录（非OIDC）"""
    try:
        # 验证输入
        if not request.email and not request.phone and not request.username:
            raise HTTPException(status_code=400, detail="用户名、邮箱或手机号至少填写一个")
        
        if not request.password:
            raise HTTPException(status_code=400, detail="密码不能为空")
        
        # 验证用户凭据
        user_info, error_type = await AuthService.authenticate_user(
            email=request.email,
            phone=request.phone,
            username=request.username,
            password=request.password
        )
        
        if error_type == "user_not_found":
            identifier = request.email or request.phone or request.username
            logger.warning(f"登录失败：用户不存在 - {identifier}")
            raise HTTPException(status_code=400, detail=f"用户不存在：{identifier}")
        elif error_type == "password_incorrect":
            identifier = request.email or request.phone or request.username
            logger.warning(f"登录失败：密码错误 - {identifier}")
            raise HTTPException(status_code=400, detail="密码错误")
        elif not user_info:
            raise HTTPException(status_code=401, detail="登录失败")
        
        # 生成JWT令牌
        token = AuthService.generate_jwt_token(user_info)
        logger.info(f"用户登录成功 - {user_info['name']} ({user_info['email']})")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"登录失败: {e}")
        raise HTTPException(status_code=500, detail="登录失败")

@router.post("/oidc/login")
async def oidc_login(request: LoginRequest):
    """OIDC登录"""
    # 这里应该重定向到OIDC提供商
    # 暂时返回模拟的成功响应
    return {"access_token": "mock_oidc_token", "token_type": "bearer"}

@router.post("/register")
async def register(request: RegisterRequest):
    """用户注册"""
    try:
        # 验证密码确认
        if request.password != request.confirm_password:
            raise HTTPException(status_code=400, detail="两次输入的密码不一致")
        
        user_data = {
            "name": request.name,
            "email": request.email,
            "phone": request.phone,
            "password": request.password,
            "user_type": request.user_type
        }
        
        user_info = await AuthService.create_user(user_data)
        token = AuthService.generate_jwt_token(user_info)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"注册失败: {e}")
        raise HTTPException(status_code=500, detail="注册失败")

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """用户注销"""
    try:
        # 在实际应用中，这里应该将token加入黑名单
        # 或者从数据库中删除refresh token等
        logger.info(f"用户 {current_user.get('name')} 已注销")
        
        return {"message": "注销成功"}
    except Exception as e:
        logger.error(f"注销失败: {e}")
        raise HTTPException(status_code=500, detail="注销失败")

@router.post("/oidc/callback")
async def oidc_callback(request: OIDCCallbackRequest):
    """处理OIDC回调"""
    try:
        code = request.code
        token_data = await AuthService.exchange_code_for_token(code)
        id_token = token_data["id_token"]
        user_info = AuthService.get_user_info_from_id_token(id_token)
        
        # 检查用户是否已存在，如果不存在则创建
        email = user_info.get("email")
        if not await AuthService.check_user_exists(email=email):
            await AuthService.create_user({
                "name": user_info.get("name", ""),
                "email": email,
                "password": "oidc_user",  # OIDC用户使用特殊密码标识
                "user_type": "programmer"
            })
        
        # 生成自有JWT令牌
        jwt_token = AuthService.generate_jwt_token(user_info)
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": user_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OIDC回调处理失败: {e}")
        raise HTTPException(status_code=500, detail="OIDC回调处理失败")

@router.get("/auth/callback")
async def auth_callback(code: str):
    """处理认证回调（重定向版本）"""
    try:
        token_data = await AuthService.exchange_code_for_token(code)
        id_token = token_data["id_token"]
        user_info = AuthService.get_user_info_from_id_token(id_token)
        
        # 检查用户是否已存在，如果不存在则创建
        email = user_info.get("email")
        if not await AuthService.check_user_exists(email=email):
            await AuthService.create_user({
                "name": user_info.get("name", ""),
                "email": email,
                "password": "oidc_user",  # OIDC用户使用特殊密码标识
                "user_type": "programmer"
            })
        
        # 生成自有JWT令牌
        jwt_token = AuthService.generate_jwt_token(user_info)
        
        # 重定向到前端，携带token
        return RedirectResponse(url=f"http://localhost:3000/auth/callback?token={jwt_token}")
    except Exception as e:
        logger.error(f"认证回调处理失败: {e}")
        return RedirectResponse(url="http://localhost:3000/login?error=auth_failed")

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取当前用户信息"""
    # 从数据库获取最新的用户信息
    user_id = current_user.get("sub")
    if user_id:
        user_info = await AuthService.get_user_by_id(user_id)
        if user_info:
            return user_info
    return current_user

@router.get("/oidc/userinfo")
async def get_oidc_userinfo(current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取OIDC用户信息"""
    return current_user