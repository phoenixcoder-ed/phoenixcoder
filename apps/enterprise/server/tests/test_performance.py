"""性能测试模块"""
import time
import asyncio
import concurrent.futures
import statistics
from typing import List, Dict, Any
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False


# 创建性能测试应用
app = FastAPI(title="PhoenixCoder Performance Test API")

@app.get("/api/v1/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "timestamp": int(time.time())}

@app.get("/api/v1/skills")
async def get_skills():
    """获取技能列表"""
    # 模拟一些处理时间
    await asyncio.sleep(0.01)
    return {
        "skills": [
            {"id": i, "name": f"Skill {i}", "category": "技术"}
            for i in range(1, 101)
        ],
        "total": 100
    }

@app.get("/api/v1/tasks")
async def get_tasks():
    """获取任务列表"""
    # 模拟数据库查询时间
    await asyncio.sleep(0.02)
    return {
        "tasks": [
            {"id": i, "title": f"Task {i}", "status": "open"}
            for i in range(1, 51)
        ],
        "total": 50
    }

@app.post("/api/v1/tasks")
async def create_task(task_data: dict = None):
    """创建任务"""
    # 模拟数据处理时间
    await asyncio.sleep(0.015)
    return {
        "id": 123,
        "title": "新任务",
        "status": "created",
        "created_at": int(time.time())
    }


@pytest.fixture
def perf_client():
    """性能测试客户端"""
    return TestClient(app)


class TestAPIPerformance:
    """API性能测试"""
    
    @pytest.mark.performance
    def test_health_check_response_time(self, perf_client):
        """测试健康检查响应时间"""
        times = []
        
        # 执行10次请求
        for _ in range(10):
            start_time = time.time()
            response = perf_client.get("/api/v1/health")
            end_time = time.time()
            
            assert response.status_code == 200
            times.append(end_time - start_time)
        
        # 计算统计信息
        avg_time = statistics.mean(times)
        max_time = max(times)
        min_time = min(times)
        
        print(f"\n健康检查性能统计:")
        print(f"平均响应时间: {avg_time:.3f}s")
        print(f"最大响应时间: {max_time:.3f}s")
        print(f"最小响应时间: {min_time:.3f}s")
        
        # 断言响应时间在合理范围内
        assert avg_time < 0.1, f"平均响应时间过长: {avg_time:.3f}s"
        assert max_time < 0.2, f"最大响应时间过长: {max_time:.3f}s"
    
    @pytest.mark.performance
    def test_skills_api_response_time(self, perf_client):
        """测试技能API响应时间"""
        times = []
        
        for _ in range(5):
            start_time = time.time()
            response = perf_client.get("/api/v1/skills")
            end_time = time.time()
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["skills"]) == 100
            times.append(end_time - start_time)
        
        avg_time = statistics.mean(times)
        print(f"\n技能API性能统计:")
        print(f"平均响应时间: {avg_time:.3f}s")
        
        # 技能API可以稍慢一些，因为返回更多数据
        assert avg_time < 0.5, f"技能API响应时间过长: {avg_time:.3f}s"
    
    @pytest.mark.performance
    def test_concurrent_requests(self, perf_client):
        """测试并发请求性能"""
        def make_request():
            """执行单个请求"""
            start_time = time.time()
            response = perf_client.get("/api/v1/health")
            end_time = time.time()
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time
            }
        
        # 使用线程池执行并发请求
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            start_time = time.time()
            futures = [executor.submit(make_request) for _ in range(20)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
            total_time = time.time() - start_time
        
        # 验证所有请求都成功
        success_count = sum(1 for r in results if r["status_code"] == 200)
        response_times = [r["response_time"] for r in results]
        
        print(f"\n并发请求性能统计:")
        print(f"总请求数: {len(results)}")
        print(f"成功请求数: {success_count}")
        print(f"总耗时: {total_time:.3f}s")
        print(f"平均响应时间: {statistics.mean(response_times):.3f}s")
        print(f"最大响应时间: {max(response_times):.3f}s")
        
        assert success_count == 20, f"并发请求失败，成功数: {success_count}/20"
        assert total_time < 2.0, f"并发请求总时间过长: {total_time:.3f}s"
    
    @pytest.mark.performance
    def test_api_throughput(self, perf_client):
        """测试API吞吐量"""
        request_count = 50
        start_time = time.time()
        
        # 快速连续发送请求
        for _ in range(request_count):
            response = perf_client.get("/api/v1/health")
            assert response.status_code == 200
        
        total_time = time.time() - start_time
        throughput = request_count / total_time
        
        print(f"\nAPI吞吐量统计:")
        print(f"请求总数: {request_count}")
        print(f"总耗时: {total_time:.3f}s")
        print(f"吞吐量: {throughput:.2f} 请求/秒")
        
        # 期望至少能达到50请求/秒的吞吐量
        assert throughput > 50, f"API吞吐量过低: {throughput:.2f} 请求/秒"
    
    @pytest.mark.performance
    @pytest.mark.slow
    def test_stress_test(self, perf_client):
        """压力测试"""
        def stress_worker():
            """压力测试工作函数"""
            results = []
            for _ in range(10):
                start_time = time.time()
                response = perf_client.get("/api/v1/skills")
                end_time = time.time()
                results.append({
                    "success": response.status_code == 200,
                    "response_time": end_time - start_time
                })
            return results
        
        # 使用多个线程模拟高并发
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            start_time = time.time()
            futures = [executor.submit(stress_worker) for _ in range(5)]
            all_results = []
            for future in concurrent.futures.as_completed(futures):
                all_results.extend(future.result())
            total_time = time.time() - start_time
        
        # 统计结果
        success_count = sum(1 for r in all_results if r["success"])
        total_requests = len(all_results)
        success_rate = success_count / total_requests * 100
        avg_response_time = statistics.mean([r["response_time"] for r in all_results])
        
        print(f"\n压力测试统计:")
        print(f"总请求数: {total_requests}")
        print(f"成功请求数: {success_count}")
        print(f"成功率: {success_rate:.1f}%")
        print(f"总耗时: {total_time:.3f}s")
        print(f"平均响应时间: {avg_response_time:.3f}s")
        
        # 压力测试的成功率应该保持在95%以上
        assert success_rate >= 95, f"压力测试成功率过低: {success_rate:.1f}%"
        assert avg_response_time < 1.0, f"压力测试平均响应时间过长: {avg_response_time:.3f}s"


class TestMemoryUsage:
    """内存使用测试"""
    
    @pytest.mark.performance
    @pytest.mark.skipif(not HAS_PSUTIL, reason="psutil not available")
    def test_memory_leak_detection(self, perf_client):
        """检测内存泄漏"""
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 执行大量请求
        for _ in range(100):
            response = perf_client.get("/api/v1/health")
            assert response.status_code == 200
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        print(f"\n内存使用统计:")
        print(f"初始内存: {initial_memory:.2f} MB")
        print(f"最终内存: {final_memory:.2f} MB")
        print(f"内存增长: {memory_increase:.2f} MB")
        
        # 内存增长不应超过50MB
        assert memory_increase < 50, f"可能存在内存泄漏，内存增长: {memory_increase:.2f} MB"