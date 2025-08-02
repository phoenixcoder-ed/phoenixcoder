from fastapi import FastAPI
from api import router as api_router
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(title="PhoenixCoder Server")

# 导入API路由
app.include_router(api_router, prefix="/api")

# 根路由
@app.get("/")
def read_root():
    return {"message": "PhoenixCoder OIDC+JWT API"}
