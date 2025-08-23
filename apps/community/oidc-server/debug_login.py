#!/usr/bin/env python3

import re
from fastapi.testclient import TestClient
from main import app

client = TestClient(app, follow_redirects=False)

print("=== 调试完整认证流程 ===")

# 1. 获取授权码
print("1. 获取授权码...")
auth_response = client.get("/authorize", params={
    "response_type": "code",
    "client_id": "test-client",
    "redirect_uri": "http://localhost:3000/callback",
    "scope": "openid profile email",
    "state": "test_state_123"
})

print(f"授权响应状态码: {auth_response.status_code}")
if auth_response.status_code != 200:
    print(f"授权响应内容: {auth_response.text}")
    exit(1)

# 从响应中提取授权码
auth_code_match = re.search(r'name="auth_code" value="([^"]+)"', auth_response.text)
if not auth_code_match:
    print("无法从响应中提取授权码")
    print(f"响应内容: {auth_response.text[:500]}...")
    exit(1)

auth_code = auth_code_match.group(1)
print(f"提取的授权码: {auth_code}")

# 2. 测试登录端点
print("\n2. 测试登录端点...")
login_data = {
    "auth_code": auth_code,
    "redirect_uri": "http://localhost:3000/callback",
    "state": "test_state_123",
    "login_type": "email",
    "email": "test@example.com",
    "password": "password123"
}

print(f"登录数据: {login_data}")

try:
    login_response = client.post("/login", data=login_data)
    print(f"登录响应状态码: {login_response.status_code}")
    print(f"登录响应头: {dict(login_response.headers)}")
    
    if login_response.status_code != 307:
        print(f"登录失败，响应内容: {login_response.text}")
        exit(1)
    
    # 从重定向 URL 中提取授权码
    redirect_url = login_response.headers["location"]
    print(f"重定向URL: {redirect_url}")
    
    code_match = re.search(r'code=([^&]+)', redirect_url)
    if not code_match:
        print("无法从重定向URL中提取授权码")
        exit(1)
    
    final_auth_code = code_match.group(1)
    print(f"最终授权码: {final_auth_code}")
        
except Exception as e:
    print(f"登录请求异常: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# 3. 用授权码换取 token
print("\n3. 用授权码换取token...")
token_data = {
    "grant_type": "authorization_code",
    "code": final_auth_code,
    "redirect_uri": "http://localhost:3000/callback",
    "client_id": "test-client"
}

print(f"Token请求数据: {token_data}")

try:
    token_response = client.post("/token", data=token_data)
    print(f"Token响应状态码: {token_response.status_code}")
    
    if token_response.status_code != 200:
        print(f"Token请求失败，响应内容: {token_response.text}")
        exit(1)
    
    token_json = token_response.json()
    print(f"Token响应: {token_json}")
    
    access_token = token_json.get('access_token')
    if not access_token:
        print("无法获取access_token")
        exit(1)
    
except Exception as e:
    print(f"Token请求异常: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# 4. 使用访问令牌获取用户信息
print("\n4. 获取用户信息...")
try:
    userinfo_response = client.get("/userinfo", headers={
        "Authorization": f"Bearer {access_token}"
    })
    print(f"用户信息响应状态码: {userinfo_response.status_code}")
    
    if userinfo_response.status_code != 200:
        print(f"用户信息请求失败，响应内容: {userinfo_response.text}")
        exit(1)
    
    user_data = userinfo_response.json()
    print(f"用户信息: {user_data}")
    
    print("\n=== 认证流程测试成功! ===")
    
except Exception as e:
    print(f"用户信息请求异常: {e}")
    import traceback
    traceback.print_exc()
    exit(1)