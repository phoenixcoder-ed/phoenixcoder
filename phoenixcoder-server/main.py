from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router
from dotenv import load_dotenv
# 导入日志配置
import logging_config
from logging_config import logger

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(title="PhoenixCoder Server")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 允许前端应用的来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有HTTP头
)

# 导入API路由
app.include_router(api_router, prefix="/api")

# 根路由
@app.get("/")
def read_root():
    return {"message": "PhoenixCoder OIDC+JWT API"}
