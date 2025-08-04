import requests
import json

# 测试预检请求
print("测试预检请求...")
preflight_headers = {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type',
}
preflight_response = requests.options('http://localhost:8001/api/oidc/login', headers=preflight_headers)
print(f"预检请求状态码: {preflight_response.status_code}")
print(f"预检请求响应头: {preflight_response.headers}")

# 测试登录请求
print("\n测试登录请求...")
login_headers = {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000',
}
login_data = {
    'email': 'test@example.com',
    'password': 'password123',
    'login_type': 'email'
}
login_response = requests.post('http://localhost:8001/api/oidc/login', headers=login_headers, data=json.dumps(login_data))
print(f"登录请求状态码: {login_response.status_code}")
print(f"登录请求响应头: {login_response.headers}")
print(f"登录请求响应体: {login_response.text}")