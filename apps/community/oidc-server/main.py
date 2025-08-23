import sys
import os

# 添加父目录到 Python 路径以便导入 shared 模块
parent_path = os.path.join(os.path.dirname(__file__), '..')
if parent_path not in sys.path:
    sys.path.insert(0, parent_path)

from fastapi import FastAPI, HTTPException, Depends, Request, Form, Body
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from jose import jwt, JWTError
from typing import Optional, Dict, Any
from models import User, UserType
import secrets
import time
import os
import bcrypt
import asyncio
import signal
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from database import DatabaseService
from models import UserCreate, WechatLoginRequest
from shared.startup_health import create_oidc_health_checker
from wechat_service import WechatService
from logging_config import logger, get_logger, auth_info, auth_error
from middleware import OIDCLoggingMiddleware, RequestContextMiddleware

# 全局变量用于优雅退出
_shutdown_event = asyncio.Event()
_active_requests = 0
_max_shutdown_wait = 30  # 最大等待时间（秒）


def setup_signal_handlers():
    """设置信号处理器"""
    def signal_handler(signum, frame):
        logger.info(f"收到信号 {signum}，开始优雅退出...")
        _shutdown_event.set()
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

# 加载项目根目录的.env.community配置文件
load_dotenv(dotenv_path="../../../.env.community")
# 也尝试加载本地.env文件作为补充
load_dotenv()

# 获取应用配置
APP_NAME = os.getenv("APP_NAME", "PhoenixCoder OIDC Server")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
APP_ENV = os.getenv("APP_ENV", "development")

# 请求计数中间件类
class RequestCounterMiddleware:
    """请求计数中间件，用于跟踪活跃请求数量"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            global _active_requests
            _active_requests += 1
            try:
                await self.app(scope, receive, send)
            finally:
                _active_requests -= 1
        else:
            await self.app(scope, receive, send)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动事件
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
    
    # 显示数据库和 Redis 连接状态
    connection_status = db_service.get_connection_status()
    postgres_status = "✅ 已连接" if connection_status["postgres"]["connected"] else "❌ 连接失败"
    redis_status = "✅ 已连接" if connection_status["redis"]["connected"] else "❌ 连接失败"
    
    app_logger.info(f"🗄️ PostgreSQL: {postgres_status}")
    app_logger.info(f"🔄 Redis: {redis_status}")
    
    # 检查微信配置
    wechat_app_id = os.getenv("WECHAT_APPID")
    wechat_app_secret = os.getenv("WECHAT_APPSECRET")
    if not wechat_app_id or not wechat_app_secret:
        app_logger.warning("⚠️ 微信登录配置不完整，微信登录功能将不可用")
    else:
        app_logger.info("✅ 微信登录配置已加载")
    
    # 显示整体服务状态
    if connection_status["postgres"]["connected"] and connection_status["redis"]["connected"]:
        app_logger.info("🎉 OIDC 服务启动完成，所有组件正常")
    elif connection_status["postgres"]["connected"] or connection_status["redis"]["connected"]:
        app_logger.warning("⚠️ OIDC 服务启动完成，部分组件不可用")
    else:
        app_logger.error("❌ OIDC 服务启动完成，但数据库和缓存均不可用")
    
    yield
    
    # 关闭事件
    app_logger.info(f"🛑 {APP_NAME} 正在关闭...")
    
    # 等待活跃请求完成
    if _active_requests > 0:
        app_logger.info(f"等待 {_active_requests} 个活跃请求完成...")
        start_time = time.time()
        
        while _active_requests > 0 and (time.time() - start_time) < _max_shutdown_wait:
            await asyncio.sleep(0.1)
        
        if _active_requests > 0:
            app_logger.warning(f"强制关闭，仍有 {_active_requests} 个请求未完成")
        else:
            app_logger.info("所有请求已完成")
    
    app_logger.info("应用关闭完成")

# 创建FastAPI应用
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="PhoenixCoder OIDC认证服务",
    docs_url="/docs" if APP_ENV == "development" else None,
    redoc_url="/redoc" if APP_ENV == "development" else None,
    lifespan=lifespan
)

# 获取应用logger
app_logger = get_logger('oidc.app')

# 添加请求计数中间件
app.add_middleware(RequestCounterMiddleware)

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



# 配置
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
JWT_ALGORITHM = "HS256"
ISSUER = os.getenv("OIDC_ISSUER", "http://localhost:8001")

# 初始化数据库服务
db_service = DatabaseService()

# 初始化微信服务
wechat_service = WechatService(db_service)

# 密码验证函数
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        app_logger.error(f"密码验证失败: {str(e)}")
        return False

# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查端点"""
    connection_status = db_service.get_connection_status()
    
    # 判断整体健康状态
    overall_status = "healthy"
    if not connection_status["postgres"]["connected"] and not connection_status["redis"]["connected"]:
        overall_status = "unhealthy"
    elif not connection_status["postgres"]["connected"] or not connection_status["redis"]["connected"]:
        overall_status = "degraded"
    
    # 检查是否正在关闭
    if _shutdown_event.is_set():
        overall_status = "shutting_down"
    
    return {
        "status": overall_status,
        "service": APP_NAME,
        "version": APP_VERSION,
        "environment": APP_ENV,
        "timestamp": int(time.time()),
        "active_requests": _active_requests,
        "shutting_down": _shutdown_event.is_set(),
        "connections": connection_status
    }

# 根路由
@app.get("/")
async def read_root(request: Request):
    """根路由"""
    app_logger.info("访问根路由")
    return {"message": "PhoenixCoder OIDC Server"}

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
        # 检查微信服务是否启用
        if not wechat_service.wechat_enabled:
            # 微信登录未启用，返回普通登录页面
            # 保存授权码
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
                    </form>
                </body>
            </html>
            """)
        
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
    try:
        auth_data = db_service.get_auth_code(auth_code)
        if not auth_data:
            auth_error(f"无效的授权码: {auth_code[:8]}...")
            raise HTTPException(status_code=400, detail="Invalid auth code")
    except HTTPException:
        # 重新抛出HTTPException，保持原有状态码
        raise
    except Exception as e:
        auth_error(f"数据库错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
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
    
    # 验证密码
    # 处理字典和对象两种格式的用户数据
    user_password_hash = user.get('password_hash') if isinstance(user, dict) else getattr(user, 'password_hash', getattr(user, 'password', None))
    
    if not verify_password(password, user_password_hash):
        auth_error(f"密码错误: {login_identifier}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 获取用户信息
    user_sub = user.get('id') if isinstance(user, dict) else getattr(user, 'sub', getattr(user, 'id', None))
    user_email = user.get('email') if isinstance(user, dict) else getattr(user, 'email', None)
    
    auth_info(f"用户登录成功: sub={user_sub}, email={user_email}")
    
    # 更新授权码，添加用户信息
    db_service.save_auth_code(
        auth_code,
        auth_data["client_id"],
        user_sub,
        auth_data["redirect_uri"],
        auth_data["scope"],
        auth_data["state"]
    )
    
    # 重定向回客户端
    redirect_url = f"{redirect_uri}?code={auth_code}"
    if state:
        redirect_url += f"&state={state}"
    
    auth_info(f"登录成功，重定向到: {redirect_url}")
    print(f"DEBUG: 重定向URL: {redirect_url}")
    print(f"DEBUG: redirect_uri: {redirect_uri}")
    print(f"DEBUG: auth_code: {auth_code}")
    print(f"DEBUG: state: {state}")
    return RedirectResponse(url=redirect_url, status_code=307)

class WechatLoginRequest(BaseModel):
    code: str = Field(..., min_length=1, description="微信授权码不能为空")

@app.post("/wechat/login")
async def wechat_login(request: Request, wechat_request: WechatLoginRequest):
    """微信登录端点"""
    code = wechat_request.code
    auth_info(f"微信登录请求: code={code[:8]}...")
    
    try:
        # 1. 获取access_token和openid
        token_info = await wechat_service.get_access_token(code)
        access_token = token_info["access_token"]
        openid = token_info["openid"]
        
        # 2. 获取微信用户信息
        user_info = await wechat_service.get_user_info(access_token, openid)
        nickname = user_info["nickname"]
        avatar_url = user_info["headimgurl"]
        
        auth_info(f"微信用户信息获取成功: openid={openid[:8]}..., nickname={nickname}")
        
        # 查找现有用户
        user = db_service.get_user_by_wechat_openid(openid)
        
        if not user:
            # 创建新用户
            import uuid
            user_id = str(uuid.uuid4())
            user = User(
                id=user_id,
                sub=user_id,
                name=nickname,
                password="wechat_user123",  # 微信用户使用特殊密码（包含数字）
                user_type=UserType.PROGRAMMER,
                email=f"{openid}@wechat.example.com",  # 生成有效的临时邮箱
                avatar=avatar_url,
                is_active=True
            )
            user = db_service.create_user(user)
            auth_info(f"创建新微信用户: sub={user.sub}, name={user.name}")
        else:
            auth_info(f"找到现有微信用户: sub={user.sub}, name={user.name}")
        
        # 检查用户是否活跃
        if not user.is_active:
            auth_error(f"用户账户未激活: sub={user.sub}")
            raise HTTPException(status_code=401, detail="Account is inactive")
        
        # 生成访问令牌
        access_token = jwt.encode(
            {
                "iss": ISSUER,
                "sub": user.sub,
                "aud": "wechat_client",
                "iat": int(time.time()),
                "exp": int(time.time()) + 3600,
                "scope": "openid profile",
                "user_type": user.user_type
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM
        )
        
        auth_info(f"微信登录成功: sub={user.sub}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 3600
        }
        
    except HTTPException:
        # 重新抛出HTTPException，保持原有状态码
        raise
    except TimeoutError as e:
        auth_error(f"微信服务超时: {str(e)}")
        raise HTTPException(status_code=500, detail="WeChat service timeout")
    except Exception as e:
        auth_error(f"微信登录失败: {str(e)}")
        error_msg = str(e)
        if "Invalid authorization code" in error_msg or "invalid_grant" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid WeChat authorization code")
        elif "Database query failed" in error_msg or "Database connection" in error_msg:
            raise HTTPException(status_code=500, detail="Database query failed")
        else:
            raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/wechat/callback")
async def wechat_callback(request: Request, code: str = None, state: str = None):
    """微信登录回调"""
    # 验证必需参数
    if not code or code.strip() == "":
        auth_error("缺少授权码参数")
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    if not state or state.strip() == "":
        auth_error("缺少state参数")
        raise HTTPException(status_code=400, detail="Missing state parameter")
    
    auth_info(f"微信登录回调: code={code[:8]}..., state={state}")
    
    # 解析state，获取auth_code和原始state
    try:
        auth_code, original_state = state.split("|", 1)
        app_logger.debug(f"解析state成功: auth_code={auth_code[:8]}..., original_state={original_state}")
    except ValueError:
        auth_error(f"无效的state参数: {state}")
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # 获取授权码信息
    try:
        auth_data = db_service.get_auth_code(auth_code)
        if not auth_data:
            auth_error(f"无效的授权码: {auth_code[:8]}...")
            raise HTTPException(status_code=400, detail="Invalid auth code")
    except HTTPException:
        # 重新抛出HTTPException，保持原有状态码
        raise
    except Exception as e:
        auth_error(f"数据库错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    # 从请求参数中获取用户类型
    user_type = UserType.PROGRAMMER  # 默认类型
    
    # 换取微信用户信息并创建用户
    try:
        auth_info("开始微信用户信息交换")
        user = await wechat_service.exchange_code_for_user(code, user_type)
        auth_info(f"微信登录成功: sub={user.sub}, name={user.name}")
    except Exception as e:
        auth_error(f"微信登录失败: {str(e)}")
        error_msg = str(e)
        if "Invalid authorization code" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid WeChat authorization code")
        else:
            raise HTTPException(status_code=400, detail="微信登录失败")
    
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
async def token(request: Request):
    """Token 端点"""
    try:
        # 检查Content-Type
        content_type = request.headers.get("content-type", "")
        if not content_type.startswith("application/x-www-form-urlencoded"):
            auth_error(f"无效的Content-Type: {content_type}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_request",
                    "error_description": "Content-Type must be application/x-www-form-urlencoded"
                }
            )
        
        # 解析表单数据
        form_data = await request.form()
        grant_type = form_data.get("grant_type", "")
        code = form_data.get("code", "")
        redirect_uri = form_data.get("redirect_uri", "")
        client_id = form_data.get("client_id", "")
        client_secret = form_data.get("client_secret", "")
        
        auth_info(f"Token请求: grant_type={grant_type}, client_id={client_id}, code={code[:8] if code else ''}...")
        
        # 检查必需参数是否为空
        # 检查每个必需参数并返回具体的错误消息
        if not grant_type:
            auth_error("缺少grant_type参数")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_request",
                    "error_description": "Missing grant_type"
                }
            )
        
        if not code:
            auth_error("缺少授权码参数")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_request",
                    "error_description": "Missing authorization code"
                }
            )
        
        if not client_id:
            auth_error("缺少client_id参数")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_request",
                    "error_description": "Missing client_id"
                }
            )
        
        if not redirect_uri:
            auth_error("缺少redirect_uri参数")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_request",
                    "error_description": "Missing redirect_uri"
                }
            )
        
        if grant_type != "authorization_code":
            auth_error(f"不支持的grant_type: {grant_type}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "unsupported_grant_type",
                    "error_description": "Only authorization_code grant type is supported"
                }
            )
        
        # 获取授权码信息
        auth_data = db_service.get_auth_code(code)
        if not auth_data:
            auth_error(f"无效的授权码: {code[:8]}...")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_grant",
                    "error_description": "Invalid authorization code"
                }
            )
        
        # 检查授权码是否过期
        if auth_data.get("expires_at", 0) < time.time():
            auth_error(f"授权码已过期: {code[:8]}...")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_grant",
                    "error_description": "Authorization code has expired"
                }
            )
        
        # 检查授权码是否已使用
        if auth_data.get("used", False):
            auth_error(f"授权码已使用: {code[:8]}...")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_grant",
                    "error_description": "Authorization code has already been used"
                }
            )
        
        # 检查授权码中的client_id是否与请求的client_id匹配
        if auth_data.get("client_id") != client_id:
            auth_error(f"Client ID不匹配: 授权码中的client_id={auth_data.get('client_id')}, 请求的client_id={client_id}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_client",
                    "error_description": "Client ID mismatch"
                }
            )
        
        # 获取用户信息（优先检查用户是否存在）
        user = db_service.get_user_by_sub(auth_data["user_sub"])
        if not user:
            auth_error(f"用户不存在: sub={auth_data['user_sub']}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_grant",
                    "error_description": "User not found"
                }
            )
        
        # 检查用户是否活跃
        if not user.is_active:
            auth_error(f"用户账户未激活: sub={user.sub}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_grant",
                    "error_description": "User account is inactive"
                }
            )
        
        # 验证应用
        app = db_service.get_application_by_client_id(client_id)
        if not app:
            auth_error(f"无效的client_id: {client_id}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_client",
                    "error_description": "Invalid client_id"
                }
            )
        
        if app["redirect_uri"] != redirect_uri:
            auth_error(f"无效的redirect_uri: {redirect_uri}, 期望: {app['redirect_uri']}")
            return JSONResponse(
                status_code=400,
                content={
                    "error": "invalid_grant",
                    "error_description": "Redirect URI mismatch"
                }
            )
        
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
            "id_token": id_token,
            "scope": auth_data["scope"]
        }
    
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        auth_error(f"认证服务异常: {str(e)} - 请求ID: {request.headers.get('X-Request-ID', 'unknown')}")
        error_msg = str(e)
        if "Database query failed" in error_msg or "Database connection" in error_msg:
            raise HTTPException(status_code=500, detail="Database query failed")
        else:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/userinfo")
async def userinfo(request: Request):
    """用户信息端点"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        auth_error("缺少Authorization头")
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not auth_header.startswith("Bearer "):
        auth_error("无效的Authorization头格式")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # 检查授权头格式是否正确
    auth_parts = auth_header.split(" ")
    if len(auth_parts) != 2:
        auth_error("无效的Authorization头格式")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = auth_parts[1]
    try:
        # 解码JWT时不验证audience，因为userinfo端点不需要特定的client_id
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        user_sub = payload["sub"]
        
        # 检查token是否过期
        if "exp" in payload and payload["exp"] < time.time():
            auth_error(f"Token已过期: sub={user_sub}")
            raise HTTPException(status_code=401, detail="Token has expired")
        
        # 检查权限范围
        scope = payload.get("scope", "")
        if "openid" not in scope:
            auth_error(f"权限不足: sub={user_sub}, scope={scope}")
            raise HTTPException(status_code=403, detail="Insufficient scope")
        
        auth_info(f"用户信息请求: sub={user_sub}")
        
        # 从数据库获取用户信息
        try:
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
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            auth_error(f"数据库查询异常: {str(e)}")
            error_msg = str(e)
            if "Database query failed" in error_msg or "Database connection" in error_msg:
                raise HTTPException(status_code=500, detail="Database query failed")
            else:
                raise HTTPException(status_code=500, detail=str(e))
        
    except jwt.ExpiredSignatureError:
        auth_error("Token已过期")
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError as e:
        auth_error(f"无效的token: {str(e)}")
        if "Invalid token" in str(e) or "signature" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid access token")
        else:
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
    uvicorn.run(app, host="0.0.0.0", port=8000)