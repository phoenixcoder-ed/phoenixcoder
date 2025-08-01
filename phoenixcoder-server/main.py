from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt, JWTError
from typing import Optional
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OIDC_ISSUER = os.getenv("OIDC_ISSUER", "https://example-oidc.com")
OIDC_CLIENT_ID = os.getenv("OIDC_CLIENT_ID", "your-client-id")
OIDC_CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "your-client-secret")
OIDC_REDIRECT_URI = os.getenv("OIDC_REDIRECT_URI", "http://localhost:8000/auth/callback")
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret")
JWT_ALGORITHM = "HS256"

app = FastAPI()

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{OIDC_ISSUER}/authorize",
    tokenUrl=f"{OIDC_ISSUER}/token"
)

@app.get("/")
def read_root():
    return {"message": "PhoenixCoder OIDC+JWT API"}

@app.get("/login")
def login():
    # 跳转到 OIDC Provider 登录
    return {
        "auth_url": f"{OIDC_ISSUER}/authorize?client_id={OIDC_CLIENT_ID}&response_type=code&scope=openid%20profile%20email&redirect_uri={OIDC_REDIRECT_URI}"
    }

@app.get("/auth/callback")
async def auth_callback(code: str):
    # 用 code 换取 OIDC token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            f"{OIDC_ISSUER}/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": OIDC_REDIRECT_URI,
                "client_id": OIDC_CLIENT_ID,
                "client_secret": OIDC_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="OIDC token 获取失败")
        token_data = token_resp.json()
        id_token = token_data.get("id_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="未获取到 id_token")
        # 解析 id_token，获取用户信息
        try:
            user_info = jwt.get_unverified_claims(id_token)
        except JWTError:
            raise HTTPException(status_code=400, detail="id_token 解析失败")
        # 生成自有 JWT
        jwt_token = jwt.encode({"sub": user_info["sub"], "email": user_info.get("email")}, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"jwt": jwt_token, "user": user_info}

@app.get("/me")
def me(token: str = Depends(oauth2_scheme)):
    # 校验 JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"user": payload}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的 token")
