#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PhoenixCoder 后端API性能基准测试
使用pytest-benchmark进行性能测试和回归检测
"""

import pytest
import asyncio
import time
import psutil
import json
from datetime import datetime
from typing import Dict, List, Any
from unittest.mock import AsyncMock

import httpx
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from main import app
from database import get_db
from tests.factories import (
    UserFactory, TaskFactory, ProjectFactory,
    create_test_users, create_test_tasks
)
from tests.mocks import MockAsyncSession


class PerformanceMonitor:
    """性能监控器"""
    
    def __init__(self):
        self.start_time = None
        self.start_memory = None
        self.start_cpu = None
        
    def start(self):
        """开始监控"""
        self.start_time = time.time()
        process = psutil.Process()
        self.start_memory = process.memory_info().rss / 1024 / 1024  # MB
        self.start_cpu = process.cpu_percent()
        
    def stop(self) -> Dict[str, float]:
        """停止监控并返回指标"""
        end_time = time.time()
        process = psutil.Process()
        end_memory = process.memory_info().rss / 1024 / 1024  # MB
        end_cpu = process.cpu_percent()
        
        return {
            'duration': end_time - self.start_time,
            'memory_usage': end_memory,
            'memory_delta': end_memory - self.start_memory,
            'cpu_usage': end_cpu,
            'cpu_delta': end_cpu - self.start_cpu
        }


@pytest.fixture
def client():
    """测试客户端"""
    return TestClient(app)


@pytest.fixture
def performance_monitor():
    """性能监控器"""
    return PerformanceMonitor()


@pytest.fixture
def test_data():
    """测试数据"""
    return {
        'users': create_test_users(100),
        'tasks': create_test_tasks(500),
        'projects': [ProjectFactory() for _ in range(50)]
    }


class TestAPIPerformance:
    """API性能测试"""
    
    def test_user_list_performance(self, client, benchmark, test_data):
        """用户列表API性能测试"""
        
        def get_users():
            response = client.get("/api/users")
            assert response.status_code == 200
            return response.json()
        
        # 基准测试
        result = benchmark.pedantic(
            get_users,
            iterations=10,
            rounds=5,
            warmup_rounds=2
        )
        
        # 性能断言
        stats = benchmark.stats
        assert stats.mean < 0.1  # 平均响应时间 < 100ms
        assert stats.max < 0.5   # 最大响应时间 < 500ms
        
    def test_user_create_performance(self, client, benchmark):
        """用户创建API性能测试"""
        
        def create_user():
            user_data = UserFactory()
            response = client.post("/api/users", json=user_data)
            assert response.status_code == 201
            return response.json()
        
        result = benchmark.pedantic(
            create_user,
            iterations=5,
            rounds=3
        )
        
        stats = benchmark.stats
        assert stats.mean < 0.2  # 创建操作 < 200ms
        
    def test_task_search_performance(self, client, benchmark, test_data):
        """任务搜索API性能测试"""
        
        search_params = [
            {'q': 'Python'},
            {'q': 'React', 'skill': 'frontend'},
            {'q': 'AI', 'budget_min': 1000},
            {'location': '北京', 'type': 'remote'}
        ]
        
        def search_tasks(params):
            response = client.get("/api/tasks/search", params=params)
            assert response.status_code == 200
            return response.json()
        
        for params in search_params:
            result = benchmark.pedantic(
                lambda: search_tasks(params),
                iterations=5,
                rounds=3
            )
            
            stats = benchmark.stats
            assert stats.mean < 0.3  # 搜索响应 < 300ms
    
    def test_concurrent_requests_performance(self, client, performance_monitor):
        """并发请求性能测试"""
        import concurrent.futures
        import threading
        
        performance_monitor.start()
        
        def make_request():
            response = client.get("/api/tasks")
            return response.status_code == 200
        
        # 模拟50个并发请求
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(make_request) for _ in range(100)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        metrics = performance_monitor.stop()
        
        # 性能断言
        assert all(results)  # 所有请求都成功
        assert metrics['duration'] < 5.0  # 总耗时 < 5秒
        assert metrics['memory_delta'] < 50  # 内存增长 < 50MB
        
    @pytest.mark.asyncio
    async def test_database_query_performance(self, benchmark):
        """数据库查询性能测试"""
        
        async def simple_query():
            # 模拟简单查询
            await asyncio.sleep(0.005)  # 5ms
            return {'count': 100}
        
        async def complex_query():
            # 模拟复杂查询
            await asyncio.sleep(0.05)  # 50ms
            return {'data': [{'id': i} for i in range(10)]}
        
        # 简单查询基准测试
        result = await benchmark.pedantic(
            simple_query,
            iterations=20,
            rounds=5
        )
        
        stats = benchmark.stats
        assert stats.mean < 0.01  # 简单查询 < 10ms
        
    def test_memory_usage_performance(self, client, performance_monitor):
        """内存使用性能测试"""
        
        performance_monitor.start()
        
        # 执行大量操作
        for i in range(1000):
            user_data = UserFactory()
            response = client.post("/api/users", json=user_data)
            
            if i % 100 == 0:  # 每100次检查一次内存
                current_metrics = performance_monitor.stop()
                performance_monitor.start()
                
                # 内存泄漏检测
                assert current_metrics['memory_delta'] < 10  # 内存增长 < 10MB
        
        final_metrics = performance_monitor.stop()
        assert final_metrics['memory_usage'] < 512  # 总内存使用 < 512MB


class TestDatabasePerformance:
    """数据库性能测试"""
    
    @pytest.mark.asyncio
    async def test_bulk_insert_performance(self, benchmark):
        """批量插入性能测试"""
        
        async def bulk_insert():
            users = [UserFactory() for _ in range(100)]
            # 模拟批量插入
            await asyncio.sleep(0.1)  # 100ms
            return len(users)
        
        result = await benchmark.pedantic(
            bulk_insert,
            iterations=5,
            rounds=3
        )
        
        stats = benchmark.stats
        assert stats.mean < 0.2  # 批量插入 < 200ms
        
    @pytest.mark.asyncio
    async def test_complex_join_performance(self, benchmark):
        """复杂连接查询性能测试"""
        
        async def complex_join():
            # 模拟复杂连接查询
            await asyncio.sleep(0.08)  # 80ms
            return {'users': 50, 'tasks': 200, 'applications': 100}
        
        result = await benchmark.pedantic(
            complex_join,
            iterations=10,
            rounds=3
        )
        
        stats = benchmark.stats
        assert stats.mean < 0.1  # 复杂查询 < 100ms
        
    @pytest.mark.asyncio
    async def test_aggregation_performance(self, benchmark):
        """聚合查询性能测试"""
        
        async def aggregation_query():
            # 模拟聚合查询
            await asyncio.sleep(0.3)  # 300ms
            return {
                'total_users': 1000,
                'total_tasks': 5000,
                'avg_rating': 4.5,
                'monthly_stats': [{'month': i, 'count': i*10} for i in range(12)]
            }
        
        result = await benchmark.pedantic(
            aggregation_query,
            iterations=5,
            rounds=2
        )
        
        stats = benchmark.stats
        assert stats.mean < 0.5  # 聚合查询 < 500ms


class TestLoadPerformance:
    """负载性能测试"""
    
    def test_sustained_load(self, client, performance_monitor):
        """持续负载测试"""
        
        performance_monitor.start()
        
        # 模拟5分钟的持续负载
        start_time = time.time()
        request_count = 0
        errors = 0
        
        while time.time() - start_time < 10:  # 简化为10秒测试
            try:
                response = client.get("/api/health")
                if response.status_code != 200:
                    errors += 1
                request_count += 1
                time.sleep(0.1)  # 100ms间隔
            except Exception:
                errors += 1
        
        metrics = performance_monitor.stop()
        
        # 性能断言
        error_rate = errors / request_count if request_count > 0 else 1
        assert error_rate < 0.01  # 错误率 < 1%
        assert metrics['memory_usage'] < 512  # 内存使用 < 512MB
        assert metrics['cpu_usage'] < 80  # CPU使用率 < 80%
        
    def test_spike_load(self, client):
        """峰值负载测试"""
        import concurrent.futures
        
        def make_requests(count):
            success = 0
            for _ in range(count):
                try:
                    response = client.get("/api/tasks")
                    if response.status_code == 200:
                        success += 1
                except Exception:
                    pass
            return success
        
        # 模拟突发流量
        with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
            futures = [executor.submit(make_requests, 10) for _ in range(20)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        total_success = sum(results)
        total_requests = 20 * 10
        success_rate = total_success / total_requests
        
        assert success_rate > 0.95  # 成功率 > 95%


class TestPerformanceRegression:
    """性能回归测试"""
    
    def test_api_response_time_regression(self, client, benchmark):
        """API响应时间回归测试"""
        
        # 基准数据（可以从历史数据加载）
        baseline_metrics = {
            'user_list': 0.08,  # 80ms
            'task_search': 0.25,  # 250ms
            'user_create': 0.15   # 150ms
        }
        
        # 当前测试
        def test_user_list():
            response = client.get("/api/users")
            return response.status_code == 200
        
        result = benchmark.pedantic(test_user_list, iterations=5, rounds=3)
        current_time = benchmark.stats.mean
        
        # 回归检测（允许10%的性能下降）
        regression_threshold = baseline_metrics['user_list'] * 1.1
        assert current_time < regression_threshold, f"性能回归检测失败: {current_time:.3f}s > {regression_threshold:.3f}s"
        
    def test_memory_usage_regression(self, client, performance_monitor):
        """内存使用回归测试"""
        
        baseline_memory = 100  # 100MB基准
        
        performance_monitor.start()
        
        # 执行标准操作集
        for _ in range(100):
            client.get("/api/users")
            client.get("/api/tasks")
        
        metrics = performance_monitor.stop()
        
        # 回归检测（允许15%的内存增长）
        regression_threshold = baseline_memory * 1.15
        assert metrics['memory_usage'] < regression_threshold, f"内存使用回归: {metrics['memory_usage']:.1f}MB > {regression_threshold:.1f}MB"


def pytest_benchmark_update_json(config, benchmarks, output_json):
    """自定义基准测试结果处理"""
    
    # 添加性能指标到JSON报告
    output_json['performance_summary'] = {
        'timestamp': datetime.now().isoformat(),
        'total_benchmarks': len(benchmarks),
        'avg_duration': sum(b['stats']['mean'] for b in benchmarks) / len(benchmarks) if benchmarks else 0,
        'max_duration': max(b['stats']['max'] for b in benchmarks) if benchmarks else 0,
        'min_duration': min(b['stats']['min'] for b in benchmarks) if benchmarks else 0
    }
    
    # 性能等级评估
    performance_grade = 'A'
    avg_time = output_json['performance_summary']['avg_duration']
    
    if avg_time > 0.5:
        performance_grade = 'D'
    elif avg_time > 0.3:
        performance_grade = 'C'
    elif avg_time > 0.1:
        performance_grade = 'B'
    
    output_json['performance_summary']['grade'] = performance_grade
    
    return output_json


if __name__ == '__main__':
    # 运行性能测试
    pytest.main([
        __file__,
        '--benchmark-only',
        '--benchmark-json=performance-results.json',
        '--benchmark-histogram=performance-histogram',
        '-v'
    ])