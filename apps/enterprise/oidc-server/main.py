from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from jose import jwt, JWTError
from typing import Optional, Dict, Any
import secrets
import time
import os
from dotenv import load_dotenv
from database import DatabaseService
from models import UserCreate, WechatLoginRequest
from shared.startup_health import create_oidc_health_checker
from wechat_service import WechatService
from logging_config import logger, get_logger, auth_info, auth_error
from middleware import OIDCLoggingMiddleware, RequestContextMiddleware

load_dotenv()

# 获取应用配置
APP_NAME = os.getenv("APP_NAME", "PhoenixCoder OIDC Server")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
APP_ENV = os.getenv("APP_ENV", "development")

# 创建FastAPI应用
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="PhoenixCoder OIDC认证服务",
    docs_url="/docs" if APP_ENV == "development" else None,
    redoc_url="/redoc" if APP_ENV == "development" else None
)

# 获取应用logger
app_logger = get_logger('oidc.app')

# 添加请求上下文中间件（必须在其他中间件之前）
app.add_middleware(RequestContextMiddleware)

# 添加OIDC专用日志中间件
app.add_middleware(
    OIDCLoggingMiddleware,
    log_requests=True,
    log_responses=True
)

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    # 判断是否为认证相关异常
    if any(request.url.path.startswith(path) for path in ['/authorize', '/login', '/token', '/userinfo']):
        auth_error(f"认证服务异常: {str(exc)} - 请求ID: {request_id}")
    else:
        app_logger.error(f"未处理的异常: {str(exc)}", exc_info=True, extra={"request_id": request_id})
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "error_description": "服务器遇到了一个错误，请稍后重试",
            "request_id": request_id
        }
    )

# 启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    app_logger.info(f"🚀 {APP_NAME} v{APP_VERSION} 启动中...")
    app_logger.info(f"📝 环境: {APP_ENV}")
    app_logger.info(f"🔧 调试模式: {os.getenv('DEBUG', 'false')}")
    app_logger.info(f"📊 日志级别: {os.getenv('LOG_LEVEL', 'INFO')}")
    app_logger.info(f"🔐 OIDC发行者: {os.getenv('OIDC_ISSUER', 'http://localhost:8001')}")
    
    # 创建启动健康检查器
    health_checker = create_oidc_health_checker()
    
    try:
        # 执行启动健康检查
        await health_checker.check_all_dependencies()
        app_logger.info("✅ 启动健康检查通过")
    except Exception as e:
        app_logger.warning(f"⚠️ 启动健康检查部分失败: {e}")
        app_logger.info("🔧 服务将在降级模式下启动")
    
    # 检查微信配置
    wechat_app_id = os.getenv("WECHAT_APPID")
    wechat_app_secret = os.getenv("WECHAT_APPSECRET")
    if not wechat_app_id or not wechat_app_secret:
        app_logger.warning("⚠️ 微信登录配置不完整，微信登录功能将不可用")
    else:
        app_logger.info("✅ 微信登录配置已加载")

# 关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    app_logger.info(f"🛑 {APP_NAME} 正在关闭...")

# 配置
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
JWT_ALGORITHM = "HS256"
ISSUER = os.getenv("OIDC_ISSUER", "http://localhost:8001")

# 初始化数据库服务
db_service = DatabaseService()

# 初始化微信服务
wechat_service = WechatService(db_service)

# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": APP_VERSION,
        "environment": APP_ENV,
        "timestamp": int(time.time())
    }

# 根路由
@app.get("/")
async def read_root(request: Request):
    """根路由"""
    app_logger.info("访问根路由")
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "description": "PhoenixCoder OIDC认证服务",
        "environment": APP_ENV,
        "endpoints": {
            "health": "/health",
            "discovery": "/.well-known/openid_configuration",
            "authorize": "/authorize",
            "token": "/token",
            "userinfo": "/userinfo",
            "register": "/register"
        }
    }

# 添加用户注册端点
@app.post("/register")
async def register(user_create: UserCreate, request: Request):
    """用户注册端点"""
    auth_info(f"用户注册请求: email={user_create.email}, phone={user_create.phone}, user_type={user_create.user_type}")
    
    # 创建新用户 - 数据库服务会检查邮箱和手机号是否已注册
    try:
        user = db_service.create_user(user_create)
        auth_info(f"用户注册成功: sub={user.sub}, email={user.email}")
    except Exception as e:
        auth_error(f"用户注册失败: {str(e)}")
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

@app.get("/.well-known/openid_configuration")
async def openid_configuration(request: Request):
    """OIDC 发现端点"""
    app_logger.debug("OIDC发现端点被访问")
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
async def authorize(
    request: Request,
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str = "openid",
    state: Optional[str] = None,
    login_type: Optional[str] = "normal"
):
    """授权端点"""
    auth_info(f"授权请求: client_id={client_id}, redirect_uri={redirect_uri}, scope={scope}, login_type={login_type}")
    
    if response_type != "code":
        auth_error(f"不支持的response_type: {response_type}")
        raise HTTPException(status_code=400, detail="Unsupported response_type")
    
    # 验证应用
    app = db_service.get_application_by_client_id(client_id)
    if not app:
        # 记录所有可用的client_id
        with db_service.pg_conn.cursor() as cursor:
            cursor.execute("SELECT client_id FROM applications")
            client_ids = cursor.fetchall()
            auth_error(f"无效的client_id: {client_id}, 数据库中可用的client_id: {client_ids}")
        raise HTTPException(status_code=400, detail="Invalid client_id")
    
    # 添加调试信息
    app_logger.debug(f"接收到的client_id: {client_id}")
    app_logger.debug(f"接收到的redirect_uri: {redirect_uri}")
    app_logger.debug(f"数据库中的应用配置: {app}")
    app_logger.debug(f"比较结果: {app['redirect_uri'] != redirect_uri}")
    
    if app["redirect_uri"] != redirect_uri:
        auth_error(f"无效的redirect_uri. 期望: {app['redirect_uri']}, 接收: {redirect_uri}")
        raise HTTPException(status_code=400, detail=f"Invalid redirect_uri. Expected: {app['redirect_uri']}, Received: {redirect_uri}")
    
    # 生成授权码
    auth_code = secrets.token_urlsafe(32)
    auth_info(f"生成授权码: {auth_code[:8]}... (已截断)")
    
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
async def login(
    request: Request,
    auth_code: str = Form(...),
    redirect_uri: str = Form(...),
    state: str = Form(""),
    login_type: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    password: str = Form(...)
):
    """处理登录"""
    # 过滤敏感信息的日志记录
    login_identifier = email if login_type == "email" else phone
    auth_info(f"用户登录尝试: login_type={login_type}, identifier={login_identifier}")
    
    # 获取授权码信息
    auth_data = db_service.get_auth_code(auth_code)
    if not auth_data:
        auth_error(f"无效的授权码: {auth_code[:8]}...")
        raise HTTPException(status_code=400, detail="Invalid auth code")
    
    # 验证用户
    user = None
    if login_type == "email" and email:
        user = db_service.get_user_by_email(email)
        app_logger.debug(f"通过邮箱查找用户: {email}")
    elif login_type == "phone" and phone:
        user = db_service.get_user_by_phone(phone)
        app_logger.debug(f"通过手机号查找用户: {phone}")
    
    if not user:
        auth_error(f"用户不存在: {login_identifier}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.password != password:
        auth_error(f"密码错误: {login_identifier}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    auth_info(f"用户登录成功: sub={user.sub}, email={user.email}")
    
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
    
    auth_info(f"登录成功，重定向到: {redirect_url}")
    return RedirectResponse(url=redirect_url)

@app.get("/wechat/callback")
async def wechat_callback(request: Request, code: str, state: str):
    """微信登录回调"""
    auth_info(f"微信登录回调: code={code[:8]}..., state={state}")
    
    # 解析state，获取auth_code和原始state
    try:
        auth_code, original_state = state.split("|", 1)
        app_logger.debug(f"解析state成功: auth_code={auth_code[:8]}..., original_state={original_state}")
    except ValueError:
        auth_error(f"无效的state参数: {state}")
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # 获取授权码信息
    auth_data = db_service.get_auth_code(auth_code)
    if not auth_data:
        auth_error(f"无效的授权码: {auth_code[:8]}...")
        raise HTTPException(status_code=400, detail="Invalid auth code")
    
    # 从请求参数中获取用户类型
    user_type = "programmer"  # 默认类型
    
    # 换取微信用户信息并创建用户
    try:
        auth_info("开始微信用户信息交换")
        user = await wechat_service.exchange_code_for_user(code, user_type)
        auth_info(f"微信登录成功: sub={user.sub}, name={user.name}")
    except Exception as e:
        auth_error(f"微信登录失败: {str(e)}")
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
    
    auth_info(f"微信登录成功，重定向到: {redirect_url}")
    return RedirectResponse(url=redirect_url)

@app.post("/token")
async def token(
    request: Request,
    grant_type: str = Form(...),
    code: str = Form(...),
    redirect_uri: str = Form(...),
    client_id: str = Form(...),
    client_secret: str = Form("")
):
    """Token 端点"""
    auth_info(f"Token请求: grant_type={grant_type}, client_id={client_id}, code={code[:8]}...")
    
    if grant_type != "authorization_code":
        auth_error(f"不支持的grant_type: {grant_type}")
        raise HTTPException(status_code=400, detail="Unsupported grant_type")
    
    # 获取授权码信息
    auth_data = db_service.get_auth_code(code)
    if not auth_data:
        auth_error(f"无效的授权码: {code[:8]}...")
        raise HTTPException(status_code=400, detail="Invalid authorization code")
    
    # 验证应用
    app = db_service.get_application_by_client_id(client_id)
    if not app:
        auth_error(f"无效的client_id: {client_id}")
        raise HTTPException(status_code=400, detail="Invalid client_id")
    
    if app["redirect_uri"] != redirect_uri:
        auth_error(f"无效的redirect_uri: {redirect_uri}, 期望: {app['redirect_uri']}")
        raise HTTPException(status_code=400, detail="Invalid redirect_uri")
    
    # 获取用户信息
    user = db_service.get_user_by_sub(auth_data["user_sub"])
    if not user:
        auth_error(f"用户不存在: sub={auth_data['user_sub']}")
        raise HTTPException(status_code=400, detail="User not found")
    
    auth_info(f"为用户生成token: sub={user.sub}, email={user.email}")
    
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
    auth_info(f"Token生成成功，授权码已删除: {code[:8]}...")
    
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 3600,
        "id_token": id_token
    }

@app.get("/userinfo")
async def userinfo(request: Request):
    """用户信息端点"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        auth_error("缺少或无效的Authorization头")
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_sub = payload["sub"]
        
        auth_info(f"用户信息请求: sub={user_sub}")
        
        # 从数据库获取用户信息
        user = db_service.get_user_by_sub(user_sub)
        if not user:
            auth_error(f"用户不存在: sub={user_sub}")
            raise HTTPException(status_code=404, detail="User not found")
        
        auth_info(f"返回用户信息: sub={user.sub}, email={user.email}")
        return {
            "sub": user.sub,
            "email": user.email,
            "name": user.name,
            "user_type": user.user_type,
            "phone": user.phone
        }
        
    except JWTError as e:
        auth_error(f"无效的token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/.well-known/jwks.json")
async def jwks(request: Request):
    """JWKS 端点"""
    app_logger.debug("JWKS端点被访问")
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