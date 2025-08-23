"""
基础API测试
"""
import pytest
from unittest.mock import patch, MagicMock


class TestBasicAPI:
    """基础API测试"""
    
    def test_root_endpoint(self, client):
        """测试根路径"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_health_check(self, client):
        """测试健康检查"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_docs_endpoint(self, client):
        """测试API文档端点"""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_openapi_endpoint(self, client):
        """测试OpenAPI规范端点"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data


class TestGrowthAPIBasic:
    """成长API基础测试"""
    
    def test_get_learning_plans_endpoint(self, client):
        """测试获取学习计划端点"""
        response = client.get("/api/v1/growth/learning-plans")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
    
    def test_get_learning_records_endpoint(self, client):
        """测试获取学习记录端点"""
        response = client.get("/api/v1/growth/learning-records")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data


class TestSkillsAPIBasic:
    """技能API基础测试"""
    
    def test_get_skills_endpoint(self, client):
        """测试获取技能列表端点"""
        response = client.get("/api/v1/skills")
        assert response.status_code == 200
        data = response.json()
        assert "skills" in data
        assert "total" in data
    
    def test_get_skill_categories_endpoint(self, client):
        """测试获取技能分类端点"""
        response = client.get("/api/v1/skills/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data


class TestAuthAPIBasic:
    """认证API基础测试"""
    
    def test_oidc_callback_endpoint_structure(self, client):
        """测试OIDC回调端点结构"""
        # 测试端点是否存在
        response = client.get("/api/v1/auth/oidc/callback?code=test_code&state=test_state")
        # 由于我们没有完整的OIDC配置，这里主要测试端点是否存在
        # 实际的状态码可能是400或500，但不应该是404
        assert response.status_code == 200
        data = response.json()
        assert "message" in data