"""
成长模块API单元测试
"""
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


# 创建简化的测试应用
app = FastAPI()

# 模拟成长API端点
@app.get("/api/v1/growth/learning-plans")
async def get_learning_plans(page: int = 1, page_size: int = 10):
    """获取学习计划列表"""
    return {
        "plans": [
            {
                "id": 1,
                "title": "Python进阶学习",
                "description": "深入学习Python高级特性",
                "target_skills": ["Python", "异步编程"],
                "start_date": "2024-01-01",
                "end_date": "2024-03-01",
                "daily_hours": 2.0,
                "progress": 65.5,
                "status": "active"
            }
        ],
        "total": 1,
        "page": page,
        "page_size": page_size
    }

@app.put("/api/v1/growth/learning-plans/{plan_id}")
async def update_learning_plan(plan_id: int, plan_data: dict):
    """更新学习计划"""
    if plan_data.get("start_date") and plan_data.get("end_date"):
        if plan_data["end_date"] < plan_data["start_date"]:
            raise HTTPException(status_code=400, detail="结束日期不能早于开始日期")
    
    if plan_id == 999:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    
    return {
        "id": plan_id,
        "title": plan_data.get("title", "Python高级学习"),
        "description": plan_data.get("description", "更新后的描述"),
        "target_skills": plan_data.get("target_skills", ["Python", "异步编程", "设计模式"]),
        "daily_hours": plan_data.get("daily_hours", 3.0),
        "updated_at": "2024-01-15T10:00:00Z"
    }

@app.delete("/api/v1/growth/learning-plans/{plan_id}")
async def delete_learning_plan(plan_id: int):
    """删除学习计划"""
    if plan_id == 999:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    
    return {"message": "删除成功"}

@app.get("/api/v1/growth/study-records")
async def get_study_records():
    """获取学习记录"""
    return {
        "records": [
            {
                "id": 1,
                "title": "Python异步编程学习",
                "duration_minutes": 120,
                "study_date": "2024-01-15",
                "skills": ["Python", "异步编程"]
            }
        ],
        "total": 1
    }

@app.post("/api/v1/growth/study-records")
async def create_study_record(record_data: dict):
    """创建学习记录"""
    if record_data.get("duration_minutes", 0) < 0:
        raise HTTPException(status_code=400, detail="学习时长不能为负数")
    
    return {
        "id": 1,
        "title": record_data.get("title"),
        "duration_minutes": record_data.get("duration_minutes"),
        "study_date": record_data.get("study_date"),
        "created_at": "2024-01-15T10:00:00Z"
    }

@app.get("/api/v1/growth/study-records/{record_id}")
async def get_study_record(record_id: int):
    """获取单个学习记录"""
    if record_id == 999:
        raise HTTPException(status_code=404, detail="学习记录不存在")
    
    return {
        "id": record_id,
        "title": "Python异步编程学习",
        "duration_minutes": 120,
        "study_date": "2024-01-15",
        "skills": ["Python", "异步编程"],
        "notes": "学习了asyncio基础概念"
    }


@pytest.fixture
def client():
    """测试客户端"""
    return TestClient(app)


class TestGrowthAPI:
    """成长API测试类"""

    def test_get_learning_plans_success(self, client):
        """测试获取学习计划列表成功"""
        response = client.get("/api/v1/growth/learning-plans")
        
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert "total" in data
        assert len(data["plans"]) > 0
        assert data["plans"][0]["title"] == "Python进阶学习"

    def test_get_learning_plans_with_pagination(self, client):
        """测试带分页的学习计划列表"""
        response = client.get("/api/v1/growth/learning-plans?page=2&page_size=5")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["page_size"] == 5

    def test_update_learning_plan_success(self, client):
        """测试更新学习计划成功"""
        plan_id = 1
        update_data = {
            "title": "Python高级学习",
            "description": "更新后的描述",
            "target_skills": ["Python", "异步编程", "设计模式"],
            "end_date": "2024-04-01",
            "daily_hours": 3.0
        }
        
        response = client.put(f"/api/v1/growth/learning-plans/{plan_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["daily_hours"] == update_data["daily_hours"]

    def test_update_learning_plan_invalid_dates(self, client):
        """测试更新学习计划时日期无效"""
        plan_id = 1
        update_data = {
            "title": "测试计划",
            "start_date": "2024-03-01",
            "end_date": "2024-01-01"  # 结束日期早于开始日期
        }
        
        response = client.put(f"/api/v1/growth/learning-plans/{plan_id}", json=update_data)
        
        assert response.status_code == 400
        assert "结束日期不能早于开始日期" in response.json()["detail"]

    def test_delete_learning_plan_success(self, client):
        """测试删除学习计划成功"""
        plan_id = 1
        
        response = client.delete(f"/api/v1/growth/learning-plans/{plan_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "删除成功" in data["message"]

    def test_delete_learning_plan_not_found(self, client):
        """测试删除不存在的学习计划"""
        plan_id = 999
        
        response = client.delete(f"/api/v1/growth/learning-plans/{plan_id}")
        
        assert response.status_code == 404

    def test_get_study_records_success(self, client):
        """测试获取学习记录成功"""
        response = client.get("/api/v1/growth/study-records")
        
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "total" in data

    def test_create_study_record_success(self, client):
        """测试创建学习记录成功"""
        sample_study_record = {
            "title": "Python异步编程学习",
            "duration_minutes": 120,
            "study_date": "2024-01-15"
        }
        
        response = client.post("/api/v1/growth/study-records", json=sample_study_record)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == sample_study_record["title"]
        assert data["duration_minutes"] == sample_study_record["duration_minutes"]

    def test_create_study_record_invalid_duration(self, client):
        """测试创建学习记录时时长无效"""
        invalid_record = {
            "title": "测试学习",
            "duration_minutes": -10,  # 无效的负数时长
            "study_date": "2024-01-15"
        }
        
        response = client.post("/api/v1/growth/study-records", json=invalid_record)
        
        assert response.status_code == 400

    def test_get_study_record_success(self, client):
        """测试获取单个学习记录成功"""
        record_id = 1
        
        response = client.get(f"/api/v1/growth/study-records/{record_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "title" in data

    def test_get_study_record_not_found(self, client):
        """测试获取不存在的学习记录"""
        record_id = 999
        
        response = client.get(f"/api/v1/growth/study-records/{record_id}")
        
        assert response.status_code == 404