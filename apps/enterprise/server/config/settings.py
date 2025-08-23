from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional, Literal, List
import secrets
import os

# 环境类型
Environment = Literal["development", "testing", "staging", "production"]

class DatabaseSettings(BaseSettings):
    """数据库配置"""
    host: str = Field(default="localhost", description="数据库主机")
    port: int = Field(default=5432, description="数据库端口")
    name: str = Field(default="phoenixcoder", description="数据库名称")
    user: str = Field(default="postgres", description="数据库用户")
    password: str = Field(description="数据库密码")
    pool_size: int = Field(default=10, description="连接池大小")
    max_overflow: int = Field(default=20, description="连接池最大溢出")
    pool_timeout: int = Field(default=30, description="连接池超时时间")
    pool_recycle: int = Field(default=3600, description="连接池回收时间")
    echo: bool = Field(default=False, description="是否打印SQL语句")
    
    @property
    def url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
    
    @property
    def async_url(self) -> str:
        """异步数据库连接URL"""
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"

class RedisSettings(BaseSettings):
    """Redis配置"""
    host: str = Field(default="localhost", description="Redis主机")
    port: int = Field(default=6379, description="Redis端口")
    password: Optional[str] = Field(default=None, description="Redis密码")
    db: int = Field(default=0, description="Redis数据库")
    max_connections: int = Field(default=20, description="最大连接数")
    socket_timeout: int = Field(default=5, description="Socket超时时间")
    socket_connect_timeout: int = Field(default=5, description="Socket连接超时时间")
    retry_on_timeout: bool = Field(default=True, description="超时重试")
    health_check_interval: int = Field(default=30, description="健康检查间隔")
    
    # 缓存配置
    default_ttl: int = Field(default=3600, description="默认缓存过期时间(秒)")
    session_ttl: int = Field(default=86400, description="会话缓存过期时间(秒)")
    user_cache_ttl: int = Field(default=1800, description="用户缓存过期时间(秒)")
    
    @property
    def url(self) -> str:
        if self.password:
            return f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"

class OIDCSettings(BaseSettings):
    """OIDC配置"""
    issuer: str = Field(description="OIDC发行者URL")
    client_id: str = Field(description="OIDC客户端ID")
    client_secret: str = Field(description="OIDC客户端密钥")
    redirect_uri: str = Field(description="OIDC重定向URI")
    
    @validator('issuer')
    def validate_issuer(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('OIDC issuer must be a valid URL')
        return v

class SecuritySettings(BaseSettings):
    """安全配置"""
    # JWT配置
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32), description="JWT密钥")
    jwt_algorithm: str = Field(default="HS256", description="JWT算法")
    jwt_expire_minutes: int = Field(default=30, description="JWT过期时间(分钟)")
    jwt_refresh_expire_days: int = Field(default=7, description="刷新令牌过期时间(天)")
    
    # 密码配置
    password_min_length: int = Field(default=8, description="密码最小长度")
    password_max_length: int = Field(default=128, description="密码最大长度")
    password_require_uppercase: bool = Field(default=True, description="密码需要大写字母")
    password_require_lowercase: bool = Field(default=True, description="密码需要小写字母")
    password_require_numbers: bool = Field(default=True, description="密码需要数字")
    password_require_special: bool = Field(default=True, description="密码需要特殊字符")
    
    # 账户安全配置
    max_login_attempts: int = Field(default=5, description="最大登录尝试次数")
    account_lockout_duration: int = Field(default=900, description="账户锁定时间(秒)")
    session_timeout: int = Field(default=3600, description="会话超时时间(秒)")
    max_sessions_per_user: int = Field(default=5, description="每用户最大会话数")
    
    # API安全配置
    rate_limit_per_minute: int = Field(default=60, description="每分钟请求限制")
    rate_limit_burst: int = Field(default=10, description="突发请求限制")
    
    @validator('jwt_secret')
    def validate_jwt_secret(cls, v):
        if len(v) < 32:
            raise ValueError('JWT secret must be at least 32 characters long')
        return v
    
    @validator('password_min_length')
    def validate_password_min_length(cls, v):
        if v < 6:
            raise ValueError('Password minimum length must be at least 6')
        return v

class Settings(BaseSettings):
    """主配置类"""
    # 环境配置
    environment: Environment = Field(default="development", description="运行环境")
    debug: bool = Field(default=False, description="调试模式")
    
    # 应用配置
    app_name: str = Field(default="PhoenixCoder", description="应用名称")
    app_version: str = Field(default="1.0.0", description="应用版本")
    app_description: str = Field(default="PhoenixCoder 程序员成长平台", description="应用描述")
    host: str = Field(default="0.0.0.0", description="服务主机")
    port: int = Field(default=8000, description="服务端口")
    workers: int = Field(default=1, description="工作进程数")
    
    # API配置
    api_prefix: str = Field(default="/api/v1", description="API前缀")
    docs_url: Optional[str] = Field(default="/docs", description="文档URL")
    redoc_url: Optional[str] = Field(default="/redoc", description="ReDoc URL")
    openapi_url: Optional[str] = Field(default="/openapi.json", description="OpenAPI URL")
    
    # 日志配置
    log_level: str = Field(default="INFO", description="日志级别")
    log_format: str = Field(default="json", description="日志格式")
    log_file: Optional[str] = Field(default=None, description="日志文件路径")
    log_rotation: str = Field(default="1 day", description="日志轮转")
    log_retention: str = Field(default="30 days", description="日志保留时间")
    
    # 监控配置
    enable_metrics: bool = Field(default=True, description="启用指标收集")
    metrics_path: str = Field(default="/metrics", description="指标路径")
    health_check_path: str = Field(default="/health", description="健康检查路径")
    
    # 文件上传配置
    max_file_size: int = Field(default=10 * 1024 * 1024, description="最大文件大小(字节)")
    allowed_file_types: List[str] = Field(
        default=["image/jpeg", "image/png", "image/gif", "application/pdf"],
        description="允许的文件类型"
    )
    upload_path: str = Field(default="uploads", description="上传文件路径")
    
    # 子配置
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    oidc: OIDCSettings = Field(default_factory=OIDCSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    
    # CORS配置
    cors_origins: List[str] = Field(default=["http://localhost:3000"], description="CORS允许的源")
    cors_methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE"], description="CORS允许的方法")
    cors_headers: List[str] = Field(default=["*"], description="CORS允许的头部")
    cors_credentials: bool = Field(default=True, description="CORS允许凭证")
    
    @validator('environment')
    def validate_environment(cls, v):
        if v == "production" and os.getenv("DEBUG", "false").lower() == "true":
            raise ValueError("Debug mode cannot be enabled in production")
        return v
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"
        case_sensitive = False

# 创建全局设置实例
settings = Settings()

def get_settings() -> Settings:
    """获取设置实例"""
    return settings

# 兼容性别名（保持向后兼容）
OIDC_ISSUER = settings.oidc.issuer
OIDC_CLIENT_ID = settings.oidc.client_id
OIDC_CLIENT_SECRET = settings.oidc.client_secret
OIDC_REDIRECT_URI = settings.oidc.redirect_uri
JWT_SECRET = settings.security.jwt_secret
JWT_ALGORITHM = settings.security.jwt_algorithm