import logging
import os
from logging.handlers import RotatingFileHandler

# 日志目录
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# 日志配置
def setup_logging():
    # 创建logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)  # 默认日志级别

    # 清除已有的处理器
    if logger.handlers:
        logger.handlers.clear()

    # 创建控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)  # 控制台输出INFO及以上级别

    # 创建文件处理器 (DEBUG级别)
    debug_file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "debug.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    debug_file_handler.setLevel(logging.DEBUG)

    # 创建错误日志处理器 (ERROR级别)
    error_file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "error.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    error_file_handler.setLevel(logging.ERROR)

    # 定义日志格式
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s"
    )
    console_handler.setFormatter(formatter)
    debug_file_handler.setFormatter(formatter)
    error_file_handler.setFormatter(formatter)

    # 添加处理器到logger
    logger.addHandler(console_handler)
    logger.addHandler(debug_file_handler)
    logger.addHandler(error_file_handler)

    return logger

# 初始化日志
logger = setup_logging()