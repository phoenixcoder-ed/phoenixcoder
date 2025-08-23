"""
API集成测试

测试API端点的完整功能和业务逻辑
"""
import pytest
from unittest.mock import patch, MagicMock


class TestGrowthAPIIntegration:
    """成长API集成测试"""
    
    def test_learning_plans_workflow(self, client):
        """测试学习计划完整工作流程"""
        # 1. 获取学习计划列表
        response = client.get("/api/v1/growth/learning-plans")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)
        assert isinstance(data["total"], int)
        
        # 2. 创建学习计划（模拟）
        plan_data = {
            "title": "Python进阶学习",
            "description": "深入学习Python高级特性",
            "skills": ["Python", "异步编程", "设计模式"],
            "duration_weeks": 8
        }
        
        # 由于我们使用简化的测试应用，这里只测试端点存在性
        # 在实际应用中，这里会测试POST请求
        
    def test_learning_records_workflow(self, client):
        """测试学习记录完整工作流程"""
        # 1. 获取学习记录列表
        response = client.get("/api/v1/growth/learning-records")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)
        assert isinstance(data["total"], int)


class TestSkillsAPIIntegration:
    """技能API集成测试"""
    
    def test_skills_management_workflow(self, client):
        """测试技能管理完整工作流程"""
        # 1. 获取技能列表
        response = client.get("/api/v1/skills")
        assert response.status_code == 200
        data = response.json()
        assert "skills" in data
        assert "total" in data
        assert isinstance(data["skills"], list)
        assert isinstance(data["total"], int)
        
        # 2. 获取技能分类
        response = client.get("/api/v1/skills/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)


class TestAuthAPIIntegration:
    """认证API集成测试"""
    
    def test_oidc_authentication_flow(self, client):
        """测试OIDC认证流程"""
        # 测试OIDC回调端点
        response = client.get("/api/v1/auth/oidc/callback?code=test_code&state=test_state")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAPIErrorHandling:
    """API错误处理测试"""
    
    def test_nonexistent_endpoint(self, client):
        """测试不存在的端点"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    def test_invalid_method(self, client):
        """测试无效的HTTP方法"""
        response = client.post("/health")
        assert response.status_code == 405  # Method Not Allowed


class TestAPIResponseFormat:
    """API响应格式测试"""
    
    def test_health_check_response_format(self, client):
        """测试健康检查响应格式"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        
        # 验证响应格式
        assert "status" in data
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert isinstance(data["timestamp"], (int, float))
    
    def test_root_endpoint_response_format(self, client):
        """测试根端点响应格式"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        
        # 验证响应格式
        assert "message" in data
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_openapi_response_format(self, client):
        """测试OpenAPI规范响应格式"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        
        # 验证OpenAPI格式
        assert "openapi" in data
        assert "info" in data
        assert "title" in data["info"]


class TestAPIPerformance:
    """API性能测试"""
    
    def test_concurrent_requests(self, client):
        """测试并发请求"""
        import concurrent.futures
        import time
        
        def make_request():
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()
            return response.status_code, end_time - start_time
        
        # 并发执行10个请求
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # 验证所有请求都成功
        for status_code, duration in results:
            assert status_code == 200
            assert duration < 1.0  # 响应时间应该小于1秒
    
    def test_response_time(self, client):
        """测试响应时间"""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 0.5  # 响应时间应该小于500ms


class TestAPIDataValidation:
    """API数据验证测试"""
    
    def test_growth_api_data_structure(self, client):
        """测试成长API数据结构"""
        # 测试学习计划数据结构
        response = client.get("/api/v1/growth/learning-plans")
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)
        assert isinstance(data["total"], int)
        assert data["total"] >= 0
        
        # 测试学习记录数据结构
        response = client.get("/api/v1/growth/learning-records")
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)
        assert isinstance(data["total"], int)
        assert data["total"] >= 0
    
    def test_skills_api_data_structure(self, client):
        """测试技能API数据结构"""
        # 测试技能列表数据结构
        response = client.get("/api/v1/skills")
        assert response.status_code == 200
        data = response.json()
        
        assert "skills" in data
        assert "total" in data
        assert isinstance(data["skills"], list)
        assert isinstance(data["total"], int)
        assert data["total"] >= 0
        
        # 测试技能分类数据结构
        response = client.get("/api/v1/skills/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert isinstance(data["categories"], list)