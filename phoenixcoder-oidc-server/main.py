from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.responses import HTMLResponse, RedirectResponse
from jose import jwt, JWTError
from typing import Optional, Dict, Any
import secrets
import time
import os
from dotenv import load_dotenv
from database import DatabaseService
from models import UserCreate, WechatLoginRequest
from wechat_service import WechatService

load_dotenv()

app = FastAPI(title="PhoenixCoder OIDC Server")

# 配置
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
JWT_ALGORITHM = "HS256"
ISSUER = os.getenv("OIDC_ISSUER", "http://localhost:8001")

# 初始化数据库服务
db_service = DatabaseService()

# 初始化微信服务
wechat_service = WechatService(db_service)

# 添加用户注册端点
@app.post("/register")
def register(user_create: UserCreate):
    """用户注册端点"""
    # 创建新用户 - 数据库服务会检查邮箱和手机号是否已注册
    try:
        user = db_service.create_user(user_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": "注册成功",
        "user": {
            "sub": user.sub,
            "email": user.email,
            "phone": user.phone,
            "name": user.name,
            "user_type": user.user_type
        }
    }

@app.get("/")
def read_root():
    return {"message": "PhoenixCoder OIDC Server"}

@app.get("/.well-known/openid_configuration")
def openid_configuration():
    """OIDC 发现端点"""
    return {
        "issuer": ISSUER,
        "authorization_endpoint": f"{ISSUER}/authorize",
        "token_endpoint": f"{ISSUER}/token",
        "userinfo_endpoint": f"{ISSUER}/userinfo",
        "jwks_uri": f"{ISSUER}/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["HS256"],
        "scopes_supported": ["openid", "profile", "email"],
        "token_endpoint_auth_methods_supported": ["client_secret_post"],
        "claims_supported": ["sub", "iss", "name", "email"]
    }

@app.get("/authorize")
def authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str = "openid",
    state: Optional[str] = None,
    login_type: Optional[str] = "normal"
):
    """授权端点"""
    if response_type != "code":
        raise HTTPException(status_code=400, detail="Unsupported response_type")
    
    # 验证应用
    app = db_service.get_application_by_client_id(client_id)
    if not app:
        raise HTTPException(status_code=400, detail="Invalid client_id")
    
    if app["redirect_uri"] != redirect_uri:
        raise HTTPException(status_code=400, detail="Invalid redirect_uri")
    
    # 生成授权码
    auth_code = secrets.token_urlsafe(32)
    
    # 根据登录类型返回不同的登录页面
    if login_type == "wechat":
        # 微信登录，重定向到微信授权页面
        wechat_app_id = os.getenv("WECHAT_APPID")
        if not wechat_app_id:
            raise HTTPException(status_code=500, detail="微信APPID未配置")
        
        # 构造微信授权URL
        wechat_redirect_uri = f"{ISSUER}/wechat/callback"
        wechat_scope = "snsapi_userinfo"
        wechat_state = f"{auth_code}|{state}"
        
        wechat_auth_url = (
            f"https://open.weixin.qq.com/connect/oauth2/authorize?"
            f"appid={wechat_app_id}&"
            f"redirect_uri={wechat_redirect_uri}&"
            f"response_type=code&"
            f"scope={wechat_scope}&"
            f"state={wechat_state}#wechat_redirect"
        )
        
        return RedirectResponse(url=wechat_auth_url)
    else:
        # 保存授权码
        # 注意：这里还没有用户信息，用户登录后会补充
        db_service.save_auth_code(auth_code, client_id, "", redirect_uri, scope, state)
        
        # 返回常规登录页面
        return HTMLResponse(f"""
        <html>
            <head><title>PhoenixCoder Login</title></head>
            <body>
                <h2>PhoenixCoder OIDC Login</h2>
                <form method="post" action="/login">
                    <input type="hidden" name="auth_code" value="{auth_code}">
                    <input type="hidden" name="redirect_uri" value="{redirect_uri}">
                    <input type="hidden" name="state" value="{state or ''}">
                    
                    <div>
                        <input type="radio" id="login-with-email" name="login_type" value="email" checked>
                        <label for="login-with-email">邮箱登录</label>
                    </div>
                    <div id="email-login-section">
                        <p>Email: <input type="email" name="email"></p>
                    </div>
                    
                    <div>
                        <input type="radio" id="login-with-phone" name="login_type" value="phone">
                        <label for="login-with-phone">手机号登录</label>
                    </div>
                    <div id="phone-login-section" style="display: none;">
                        <p>Phone: <input type="tel" name="phone"></p>
                    </div>
                    
                    <p>Password: <input type="password" name="password" required></p>
                    <button type="submit">Login</button>
                    <p>或者</p>
                    <a href="/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}&login_type=wechat">
                        微信登录
                    </a>
                </form>
                
                <script>
                    // 切换登录方式
                    document.getElementById('login-with-email').addEventListener('change', function() {{
                        document.getElementById('email-login-section').style.display = 'block';
                        document.getElementById('phone-login-section').style.display = 'none';
                    }});
                    
                    document.getElementById('login-with-phone').addEventListener('change', function() {{
                        document.getElementById('email-login-section').style.display = 'none';
                        document.getElementById('phone-login-section').style.display = 'block';
                    }});
                </script>
            </body>
        </html>
        """)

@app.post("/login")
def login(
    auth_code: str = Form(...),
    redirect_uri: str = Form(...),
    state: str = Form(""),
    login_type: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    password: str = Form(...)
):
    """处理登录"""
    # 获取授权码信息
    auth_data = db_service.get_auth_code(auth_code)
    if not auth_data:
        raise HTTPException(status_code=400, detail="Invalid auth code")
    
    # 验证用户
    user = None
    if login_type == "email" and email:
        user = db_service.get_user_by_email(email)
    elif login_type == "phone" and phone:
        user = db_service.get_user_by_phone(phone)
    
    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 更新授权码，添加用户信息
    db_service.save_auth_code(
        auth_code,
        auth_data["client_id"],
        user.sub,
        auth_data["redirect_uri"],
        auth_data["scope"],
        auth_data["state"]
    )
    
    # 重定向回客户端
    redirect_url = f"{redirect_uri}?code={auth_code}"
    if state:
        redirect_url += f"&state={state}"
    
    return RedirectResponse(url=redirect_url)

@app.get("/wechat/callback")
async def wechat_callback(code: str, state: str):
    """微信登录回调"""
    # 解析state，获取auth_code和原始state
    try:
        auth_code, original_state = state.split("|", 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # 获取授权码信息
    auth_data = db_service.get_auth_code(auth_code)
    if not auth_data:
        raise HTTPException(status_code=400, detail="Invalid auth code")
    
    # 从请求参数中获取用户类型
    user_type = "programmer"  # 默认类型
    
    # 换取微信用户信息并创建用户
    try:
        user = await wechat_service.exchange_code_for_user(code, user_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"微信登录失败: {str(e)}")
    
    # 更新授权码，添加用户信息
    db_service.save_auth_code(
        auth_code,
        auth_data["client_id"],
        user.sub,
        auth_data["redirect_uri"],
        auth_data["scope"],
        original_state
    )
    
    # 重定向回客户端
    redirect_url = f"{auth_data['redirect_uri']}?code={auth_code}"
    if original_state:
        redirect_url += f"&state={original_state}"
    
    return RedirectResponse(url=redirect_url)

@app.post("/token")
def token(
    grant_type: str = Form(...),
    code: str = Form(...),
    redirect_uri: str = Form(...),
    client_id: str = Form(...),
    client_secret: str = Form("")
):
    """Token 端点"""
    if grant_type != "authorization_code":
        raise HTTPException(status_code=400, detail="Unsupported grant_type")
    
    # 获取授权码信息
    auth_data = db_service.get_auth_code(code)
    if not auth_data:
        raise HTTPException(status_code=400, detail="Invalid authorization code")
    
    # 验证应用
    app = db_service.get_application_by_client_id(client_id)
    if not app:
        raise HTTPException(status_code=400, detail="Invalid client_id")
    
    if app["redirect_uri"] != redirect_uri:
        raise HTTPException(status_code=400, detail="Invalid redirect_uri")
    
    # 获取用户信息
    user = db_service.get_user_by_sub(auth_data["user_sub"])
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # 生成访问令牌
    access_token = jwt.encode(
        {
            "iss": ISSUER,
            "sub": user.sub,
            "aud": client_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            "scope": auth_data["scope"],
            "user_type": user.user_type
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # 生成 ID Token
    id_token = jwt.encode(
        {
            "iss": ISSUER,
            "sub": user.sub,
            "aud": client_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            "email": user.email,
            "name": user.name,
            "user_type": user.user_type
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # 删除已使用的授权码
    db_service.delete_auth_code(code)
    
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 3600,
        "id_token": id_token
    }

@app.get("/userinfo")
def userinfo(request: Request):
    """用户信息端点"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_sub = payload["sub"]
        
        # 查找用户信息
        for user in users.values():
            if user["sub"] == user_sub:
                return {
                    "sub": user["sub"],
                    "email": user["email"],
                    "name": user["name"]
                }
        
        raise HTTPException(status_code=404, detail="User not found")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/.well-known/jwks.json")
def jwks():
    """JWKS 端点"""
    return {
        "keys": [
            {
                "kty": "oct",
                "use": "sig",
                "alg": "HS256",
                "k": JWT_SECRET
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)