from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# 检查健康端点
try:
    response = client.get('/health')
    print(f'Health endpoint status: {response.status_code}')
except Exception as e:
    print(f'Health endpoint error: {e}')

# 检查微信回调端点
try:
    response = client.get('/wechat/callback?code=test&state=test')
    print(f'WeChat callback status: {response.status_code}')
    print(f'WeChat callback response: {response.text[:200]}')
except Exception as e:
    print(f'WeChat callback error: {e}')

# 列出所有路由
print('\nAvailable routes:')
for route in app.routes:
    methods = getattr(route, 'methods', 'N/A')
    print(f'  {route.path} - {methods}')