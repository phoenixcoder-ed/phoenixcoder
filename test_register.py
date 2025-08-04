import requests
import json

# 测试注册功能
def test_register():
    url = "http://localhost:8001/api/register"
    headers = {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000"
    }
    # 使用一个未注册的邮箱
    data = {
        "email": "newuser@example.com",
        "password": "password123",
        "name": "New User",
        "phone": "13800138000"
    }
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"注册响应状态码: {response.status_code}")
    print(f"注册响应内容: {response.text}")
    
    # 测试邮箱已存在的情况
    data = {
        "email": "test@example.com",
        "password": "password123",
        "name": "Existing User",
        "phone": "13800138000"
    }
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"重复注册响应状态码: {response.status_code}")
    print(f"重复注册响应内容: {response.text}")

if __name__ == "__main__":
    test_register()