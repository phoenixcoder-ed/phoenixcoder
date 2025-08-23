import logging
import os
import sys
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime
from typing import Optional

# 日志目录
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# 日志级别映射
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}

class ColoredFormatter(logging.Formatter):
    """带颜色的日志格式化器"""
    
    # 颜色代码
    COLORS = {
        'DEBUG': '\033[36m',      # 青色
        'INFO': '\033[32m',       # 绿色
        'WARNING': '\033[33m',    # 黄色
        'ERROR': '\033[31m',      # 红色
        'CRITICAL': '\033[35m',   # 紫色
        'RESET': '\033[0m'        # 重置
    }
    
    def format(self, record):
        # 添加颜色
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.COLORS['RESET']}"
        
        return super().format(record)

class RequestIdFilter(logging.Filter):
    """添加请求ID的过滤器"""
    
    def filter(self, record):
        # 尝试从上下文中获取请求ID
        request_id = getattr(record, 'request_id', None)
        if not request_id:
            # 如果没有请求ID，生成一个简单的标识
            record.request_id = f"req-{datetime.now().strftime('%H%M%S')}"
        return True

def get_log_level() -> int:
    """从环境变量获取日志级别"""
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    return LOG_LEVELS.get(log_level, logging.INFO)

def is_debug_mode() -> bool:
    """检查是否为调试模式"""
    debug = os.getenv('DEBUG', 'false').lower()
    return debug in ('true', '1', 'yes', 'on')

def setup_logging(
    log_level: Optional[str] = None,
    enable_console_colors: bool = True,
    enable_request_id: bool = True
) -> logging.Logger:
    """
    设置日志配置
    
    Args:
        log_level: 日志级别，如果为None则从环境变量读取
        enable_console_colors: 是否启用控制台颜色
        enable_request_id: 是否启用请求ID
    
    Returns:
        配置好的logger实例
    """
    # 获取根logger
    root_logger = logging.getLogger()
    
    # 设置日志级别
    if log_level:
        level = LOG_LEVELS.get(log_level.upper(), logging.INFO)
    else:
        level = get_log_level()
    
    root_logger.setLevel(level)
    
    # 清除已有的处理器
    if root_logger.handlers:
        root_logger.handlers.clear()
    
    # 创建请求ID过滤器
    request_filter = RequestIdFilter() if enable_request_id else None
    
    # 1. 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_level = logging.DEBUG if is_debug_mode() else logging.INFO
    console_handler.setLevel(console_level)
    
    # 控制台格式（带颜色或不带颜色）
    if enable_console_colors and sys.stdout.isatty():
        console_format = "%(asctime)s | %(request_id)s | %(levelname)s | %(name)s:%(lineno)d | %(message)s"
        console_formatter = ColoredFormatter(console_format, datefmt='%H:%M:%S')
    else:
        console_format = "%(asctime)s | %(request_id)s | %(levelname)s | %(name)s:%(lineno)d | %(message)s"
        console_formatter = logging.Formatter(console_format, datefmt='%Y-%m-%d %H:%M:%S')
    
    console_handler.setFormatter(console_formatter)
    if request_filter:
        console_handler.addFilter(request_filter)
    
    # 2. 调试日志文件处理器（按天轮转）
    debug_file_handler = TimedRotatingFileHandler(
        os.path.join(LOG_DIR, "debug.log"),
        when='midnight',
        interval=1,
        backupCount=7,  # 保留7天
        encoding="utf-8"
    )
    debug_file_handler.setLevel(logging.DEBUG)
    debug_file_handler.suffix = "%Y-%m-%d"
    
    # 3. 应用日志文件处理器（按大小轮转）
    app_file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "app.log"),
        maxBytes=20*1024*1024,  # 20MB
        backupCount=10,
        encoding="utf-8"
    )
    app_file_handler.setLevel(logging.INFO)
    
    # 4. 错误日志文件处理器
    error_file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "error.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    error_file_handler.setLevel(logging.ERROR)
    
    # 文件日志格式
    file_format = "%(asctime)s | %(request_id)s | %(levelname)s | %(name)s | %(module)s:%(funcName)s:%(lineno)d | %(message)s"
    file_formatter = logging.Formatter(file_format, datefmt='%Y-%m-%d %H:%M:%S')
    
    # 设置文件处理器格式和过滤器
    for handler in [debug_file_handler, app_file_handler, error_file_handler]:
        handler.setFormatter(file_formatter)
        if request_filter:
            handler.addFilter(request_filter)
    
    # 添加所有处理器到根logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(debug_file_handler)
    root_logger.addHandler(app_file_handler)
    root_logger.addHandler(error_file_handler)
    
    # 创建应用专用logger
    app_logger = logging.getLogger('phoenixcoder')
    
    # 记录初始化信息
    app_logger.info(f"日志系统初始化完成")
    app_logger.info(f"日志级别: {logging.getLevelName(level)}")
    app_logger.info(f"调试模式: {is_debug_mode()}")
    app_logger.info(f"日志目录: {os.path.abspath(LOG_DIR)}")
    
    return app_logger

def get_logger(name: str = None) -> logging.Logger:
    """
    获取logger实例
    
    Args:
        name: logger名称，如果为None则返回应用默认logger
    
    Returns:
        logger实例
    """
    if name:
        return logging.getLogger(f'phoenixcoder.{name}')
    return logging.getLogger('phoenixcoder')

# 初始化日志系统
logger = setup_logging()

# 导出常用的日志函数
def debug(msg, *args, **kwargs):
    """调试日志"""
    logger.debug(msg, *args, **kwargs)

def info(msg, *args, **kwargs):
    """信息日志"""
    logger.info(msg, *args, **kwargs)

def warning(msg, *args, **kwargs):
    """警告日志"""
    logger.warning(msg, *args, **kwargs)

def error(msg, *args, **kwargs):
    """错误日志"""
    logger.error(msg, *args, **kwargs)

def critical(msg, *args, **kwargs):
    """严重错误日志"""
    logger.critical(msg, *args, **kwargs)