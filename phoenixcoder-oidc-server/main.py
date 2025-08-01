from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.responses import HTMLResponse, RedirectResponse
from jose import jwt, JWTError
from typing import Optional, Dict, Any
import secrets
import time
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PhoenixCoder OIDC Server")

# 配置
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
JWT_ALGORITHM = "HS256"
ISSUER = os.getenv("OIDC_ISSUER", "http://localhost:8001")

# 存储授权码和用户信息（生产环境应使用数据库）
auth_codes = {}
users = {
    "test@example.com": {
        "sub": "user123",
        "email": "test@example.com",
        "name": "Test User",
        "password": "password123"
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
    state: Optional[str] = None
):
    """授权端点"""
    if response_type != "code":
        raise HTTPException(status_code=400, detail="Unsupported response_type")
    
    # 生成授权码
    auth_code = secrets.token_urlsafe(32)
    auth_codes[auth_code] = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "state": state,
        "expires_at": time.time() + 600  # 10分钟过期
    }
    
    # 返回登录页面
    return HTMLResponse(f"""
    <html>
        <head><title>PhoenixCoder Login</title></head>
        <body>
            <h2>PhoenixCoder OIDC Login</h2>
            <form method="post" action="/login">
                <input type="hidden" name="auth_code" value="{auth_code}">
                <input type="hidden" name="redirect_uri" value="{redirect_uri}">
                <input type="hidden" name="state" value="{state or ''}">
                <p>Email: <input type="email" name="email" required></p>
                <p>Password: <input type="password" name="password" required></p>
                <button type="submit">Login</button>
            </form>
        </body>
    </html>
    """)

@app.post("/login")
def login(
    auth_code: str = Form(...),
    redirect_uri: str = Form(...),
    state: str = Form(""),
    email: str = Form(...),
    password: str = Form(...)
):
    """处理登录"""
    if auth_code not in auth_codes:
        raise HTTPException(status_code=400, detail="Invalid auth code")
    
    auth_data = auth_codes[auth_code]
    if time.time() > auth_data["expires_at"]:
        del auth_codes[auth_code]
        raise HTTPException(status_code=400, detail="Auth code expired")
    
    # 验证用户
    if email not in users or users[email]["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users[email]
    
    # 生成 ID Token
    id_token = jwt.encode(
        {
            "iss": ISSUER,
            "sub": user["sub"],
            "aud": auth_data["client_id"],
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            "email": user["email"],
            "name": user["name"]
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # 重定向回客户端
    redirect_url = f"{redirect_uri}?code={auth_code}"
    if state:
        redirect_url += f"&state={state}"
    
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
    
    if code not in auth_codes:
        raise HTTPException(status_code=400, detail="Invalid authorization code")
    
    auth_data = auth_codes[code]
    if time.time() > auth_data["expires_at"]:
        del auth_codes[code]
        raise HTTPException(status_code=400, detail="Authorization code expired")
    
    if auth_data["client_id"] != client_id or auth_data["redirect_uri"] != redirect_uri:
        raise HTTPException(status_code=400, detail="Invalid client_id or redirect_uri")
    
    # 获取用户信息
    user = None
    for u in users.values():
        if u["sub"] == auth_data.get("user_sub"):
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # 生成访问令牌
    access_token = jwt.encode(
        {
            "iss": ISSUER,
            "sub": user["sub"],
            "aud": client_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            "scope": auth_data["scope"]
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # 生成 ID Token
    id_token = jwt.encode(
        {
            "iss": ISSUER,
            "sub": user["sub"],
            "aud": client_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            "email": user["email"],
            "name": user["name"]
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # 删除已使用的授权码
    del auth_codes[code]
    
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