#!/usr/bin/env python3
"""
PhoenixCoder 测试报告生成器

该脚本用于聚合所有测试结果并生成统一的测试报告。
支持多种输出格式：HTML、JSON、Markdown
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import xml.etree.ElementTree as ET
from dataclasses import dataclass, asdict
import re


@dataclass
class TestResult:
    """测试结果数据类"""
    name: str
    total: int
    passed: int
    failed: int
    skipped: int
    duration: float
    coverage: Optional[float] = None
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


@dataclass
class TestSummary:
    """测试总结数据类"""
    timestamp: str
    overall_status: str
    total_tests: int
    total_passed: int
    total_failed: int
    total_skipped: int
    total_duration: float
    overall_coverage: float
    backend: TestResult
    frontend: TestResult
    miniprogram: TestResult
    e2e: TestResult
    security: Dict[str, Any]
    performance: Dict[str, Any]


class TestReportGenerator:
    """测试报告生成器"""
    
    def __init__(self, artifacts_dir: str, output_dir: str):
        self.artifacts_dir = Path(artifacts_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def parse_junit_xml(self, xml_file: Path) -> TestResult:
        """解析JUnit XML文件"""
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            # 处理不同的JUnit XML格式
            if root.tag == 'testsuites':
                testsuite = root.find('testsuite')
                if testsuite is not None:
                    root = testsuite
            
            total = int(root.get('tests', 0))
            failures = int(root.get('failures', 0))
            errors = int(root.get('errors', 0))
            skipped = int(root.get('skipped', 0))
            duration = float(root.get('time', 0))
            
            failed = failures + errors
            passed = total - failed - skipped
            
            # 收集错误信息
            error_messages = []
            for testcase in root.findall('.//testcase'):
                failure = testcase.find('failure')
                error = testcase.find('error')
                if failure is not None:
                    error_messages.append(f"{testcase.get('name')}: {failure.get('message', 'Unknown failure')}")
                elif error is not None:
                    error_messages.append(f"{testcase.get('name')}: {error.get('message', 'Unknown error')}")
            
            return TestResult(
                name=xml_file.stem,
                total=total,
                passed=passed,
                failed=failed,
                skipped=skipped,
                duration=duration,
                errors=error_messages
            )
        except Exception as e:
            print(f"Error parsing {xml_file}: {e}")
            return TestResult(
                name=xml_file.stem,
                total=0,
                passed=0,
                failed=1,
                skipped=0,
                duration=0,
                errors=[f"Failed to parse test results: {str(e)}"]
            )
    
    def parse_coverage_json(self, coverage_file: Path) -> float:
        """解析覆盖率JSON文件"""
        try:
            with open(coverage_file, 'r') as f:
                data = json.load(f)
            
            # 处理不同的覆盖率格式
            if 'total' in data:
                # Jest/Vitest格式
                if 'lines' in data['total']:
                    return data['total']['lines']['pct']
                elif 'statements' in data['total']:
                    return data['total']['statements']['pct']
            elif 'totals' in data:
                # Coverage.py格式
                return data['totals']['percent_covered']
            elif 'summary' in data:
                # 其他格式
                return data['summary']['lines']['pct']
            
            return 0.0
        except Exception as e:
            print(f"Error parsing coverage {coverage_file}: {e}")
            return 0.0
    
    def collect_backend_results(self) -> TestResult:
        """收集后端测试结果"""
        backend_dir = self.artifacts_dir / 'backend-test-results'
        if not backend_dir.exists():
            return TestResult("backend", 0, 0, 0, 0, 0)
        
        # 查找JUnit XML文件
        junit_files = list(backend_dir.glob('**/pytest-*.xml'))
        if not junit_files:
            junit_files = list(backend_dir.glob('**/*.xml'))
        
        if junit_files:
            result = self.parse_junit_xml(junit_files[0])
            result.name = "backend"
            
            # 查找覆盖率文件
            coverage_files = list(backend_dir.glob('**/coverage.json'))
            if coverage_files:
                result.coverage = self.parse_coverage_json(coverage_files[0])
            
            return result
        
        return TestResult("backend", 0, 0, 1, 0, 0, errors=["No test results found"])
    
    def collect_frontend_results(self) -> TestResult:
        """收集前端测试结果"""
        frontend_dir = self.artifacts_dir / 'frontend-test-results-admin'
        if not frontend_dir.exists():
            return TestResult("frontend", 0, 0, 0, 0, 0)
        
        # 查找JUnit XML文件
        junit_files = list(frontend_dir.glob('**/vitest-*.xml'))
        if not junit_files:
            junit_files = list(frontend_dir.glob('**/*.xml'))
        
        if junit_files:
            result = self.parse_junit_xml(junit_files[0])
            result.name = "frontend"
            
            # 查找覆盖率文件
            coverage_files = list(frontend_dir.glob('**/coverage-final.json'))
            if coverage_files:
                result.coverage = self.parse_coverage_json(coverage_files[0])
            
            return result
        
        return TestResult("frontend", 0, 0, 1, 0, 0, errors=["No test results found"])
    
    def collect_miniprogram_results(self) -> TestResult:
        """收集小程序测试结果"""
        miniprogram_dir = self.artifacts_dir / 'miniprogram-test-results-miniprogram'
        if not miniprogram_dir.exists():
            return TestResult("miniprogram", 0, 0, 0, 0, 0)
        
        # 查找JUnit XML文件
        junit_files = list(miniprogram_dir.glob('**/vitest-*.xml'))
        if not junit_files:
            junit_files = list(miniprogram_dir.glob('**/*.xml'))
        
        if junit_files:
            result = self.parse_junit_xml(junit_files[0])
            result.name = "miniprogram"
            
            # 查找覆盖率文件
            coverage_files = list(miniprogram_dir.glob('**/coverage-final.json'))
            if coverage_files:
                result.coverage = self.parse_coverage_json(coverage_files[0])
            
            return result
        
        return TestResult("miniprogram", 0, 0, 1, 0, 0, errors=["No test results found"])
    
    def collect_e2e_results(self) -> TestResult:
        """收集E2E测试结果"""
        e2e_dir = self.artifacts_dir / 'e2e-test-results'
        if not e2e_dir.exists():
            return TestResult("e2e", 0, 0, 0, 0, 0)
        
        # 查找Playwright结果
        junit_files = list(e2e_dir.glob('**/results.xml'))
        if not junit_files:
            junit_files = list(e2e_dir.glob('**/*.xml'))
        
        if junit_files:
            result = self.parse_junit_xml(junit_files[0])
            result.name = "e2e"
            return result
        
        return TestResult("e2e", 0, 0, 1, 0, 0, errors=["No test results found"])
    
    def collect_security_results(self) -> Dict[str, Any]:
        """收集安全扫描结果"""
        security_results = {
            'trivy': {'status': 'not_run', 'vulnerabilities': 0, 'high': 0, 'medium': 0, 'low': 0},
            'snyk': {'status': 'not_run', 'vulnerabilities': 0, 'high': 0, 'medium': 0, 'low': 0}
        }
        
        # 查找Trivy结果
        trivy_files = list(self.artifacts_dir.glob('**/trivy-results.sarif'))
        if trivy_files:
            try:
                with open(trivy_files[0], 'r') as f:
                    trivy_data = json.load(f)
                
                vulnerabilities = 0
                high = medium = low = 0
                
                for run in trivy_data.get('runs', []):
                    for result in run.get('results', []):
                        vulnerabilities += len(result.get('locations', []))
                        level = result.get('level', 'note')
                        if level == 'error':
                            high += 1
                        elif level == 'warning':
                            medium += 1
                        else:
                            low += 1
                
                security_results['trivy'] = {
                    'status': 'completed',
                    'vulnerabilities': vulnerabilities,
                    'high': high,
                    'medium': medium,
                    'low': low
                }
            except Exception as e:
                security_results['trivy']['status'] = f'error: {str(e)}'
        
        return security_results
    
    def collect_performance_results(self) -> Dict[str, Any]:
        """收集性能测试结果"""
        performance_results = {
            'status': 'not_run',
            'response_time': {'avg': 0, 'p95': 0, 'p99': 0},
            'throughput': 0,
            'error_rate': 0
        }
        
        # 查找k6结果
        k6_files = list(self.artifacts_dir.glob('**/performance-results.json'))
        if k6_files:
            try:
                with open(k6_files[0], 'r') as f:
                    k6_data = json.load(f)
                
                metrics = k6_data.get('metrics', {})
                
                if 'http_req_duration' in metrics:
                    duration = metrics['http_req_duration']['values']
                    performance_results['response_time'] = {
                        'avg': duration.get('avg', 0),
                        'p95': duration.get('p(95)', 0),
                        'p99': duration.get('p(99)', 0)
                    }
                
                if 'http_reqs' in metrics:
                    performance_results['throughput'] = metrics['http_reqs']['values'].get('rate', 0)
                
                if 'http_req_failed' in metrics:
                    performance_results['error_rate'] = metrics['http_req_failed']['values'].get('rate', 0)
                
                performance_results['status'] = 'completed'
                
            except Exception as e:
                performance_results['status'] = f'error: {str(e)}'
        
        return performance_results
    
    def generate_summary(self) -> TestSummary:
        """生成测试总结"""
        backend = self.collect_backend_results()
        frontend = self.collect_frontend_results()
        miniprogram = self.collect_miniprogram_results()
        e2e = self.collect_e2e_results()
        security = self.collect_security_results()
        performance = self.collect_performance_results()
        
        # 计算总体统计
        total_tests = backend.total + frontend.total + miniprogram.total + e2e.total
        total_passed = backend.passed + frontend.passed + miniprogram.passed + e2e.passed
        total_failed = backend.failed + frontend.failed + miniprogram.failed + e2e.failed
        total_skipped = backend.skipped + frontend.skipped + miniprogram.skipped + e2e.skipped
        total_duration = backend.duration + frontend.duration + miniprogram.duration + e2e.duration
        
        # 计算总体覆盖率
        coverages = [r.coverage for r in [backend, frontend, miniprogram] if r.coverage is not None]
        overall_coverage = sum(coverages) / len(coverages) if coverages else 0
        
        # 确定总体状态
        overall_status = "success" if total_failed == 0 else "failure"
        
        return TestSummary(
            timestamp=datetime.now().isoformat(),
            overall_status=overall_status,
            total_tests=total_tests,
            total_passed=total_passed,
            total_failed=total_failed,
            total_skipped=total_skipped,
            total_duration=total_duration,
            overall_coverage=overall_coverage,
            backend=backend,
            frontend=frontend,
            miniprogram=miniprogram,
            e2e=e2e,
            security=security,
            performance=performance
        )
    
    def generate_html_report(self, summary: TestSummary) -> str:
        """生成HTML报告"""
        html_template = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhoenixCoder 测试报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header .timestamp {
            margin-top: 10px;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .details {
            padding: 30px;
        }
        .test-section {
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        .test-section h2 {
            margin: 0;
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .test-content {
            padding: 20px;
        }
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .test-metric {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .test-metric .label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .test-metric .value {
            font-size: 1.5em;
            font-weight: bold;
        }
        .errors {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 15px;
            margin-top: 15px;
        }
        .errors h4 {
            margin: 0 0 10px 0;
            color: #721c24;
        }
        .errors ul {
            margin: 0;
            padding-left: 20px;
        }
        .errors li {
            margin-bottom: 5px;
            color: #721c24;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 PhoenixCoder 测试报告</h1>
            <div class="timestamp">生成时间: {timestamp}</div>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>总体状态</h3>
                <div class="value {overall_status_class}">{overall_status_text}</div>
            </div>
            <div class="summary-card">
                <h3>总测试数</h3>
                <div class="value info">{total_tests}</div>
            </div>
            <div class="summary-card">
                <h3>通过率</h3>
                <div class="value {pass_rate_class}">{pass_rate:.1f}%</div>
            </div>
            <div class="summary-card">
                <h3>覆盖率</h3>
                <div class="value info">{overall_coverage:.1f}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {overall_coverage:.1f}%"></div>
                </div>
            </div>
            <div class="summary-card">
                <h3>执行时间</h3>
                <div class="value info">{total_duration:.1f}s</div>
            </div>
        </div>
        
        <div class="details">
            {test_sections}
        </div>
    </div>
</body>
</html>
        """
        
        # 计算通过率
        pass_rate = (summary.total_passed / summary.total_tests * 100) if summary.total_tests > 0 else 0
        
        # 状态样式
        overall_status_class = "success" if summary.overall_status == "success" else "failure"
        overall_status_text = "✅ 通过" if summary.overall_status == "success" else "❌ 失败"
        pass_rate_class = "success" if pass_rate >= 90 else "warning" if pass_rate >= 70 else "failure"
        
        # 生成测试部分
        test_sections = ""
        for test_result in [summary.backend, summary.frontend, summary.miniprogram, summary.e2e]:
            section_html = self._generate_test_section_html(test_result)
            test_sections += section_html
        
        # 添加安全和性能部分
        test_sections += self._generate_security_section_html(summary.security)
        test_sections += self._generate_performance_section_html(summary.performance)
        
        return html_template.format(
            timestamp=summary.timestamp,
            overall_status_class=overall_status_class,
            overall_status_text=overall_status_text,
            total_tests=summary.total_tests,
            pass_rate=pass_rate,
            pass_rate_class=pass_rate_class,
            overall_coverage=summary.overall_coverage,
            total_duration=summary.total_duration,
            test_sections=test_sections
        )
    
    def _generate_test_section_html(self, test_result: TestResult) -> str:
        """生成测试部分HTML"""
        coverage_html = ""
        if test_result.coverage is not None:
            coverage_html = f"""
            <div class="test-metric">
                <div class="label">覆盖率</div>
                <div class="value info">{test_result.coverage:.1f}%</div>
            </div>
            """
        
        errors_html = ""
        if test_result.errors:
            errors_list = "\n".join([f"<li>{error}</li>" for error in test_result.errors[:10]])  # 限制显示前10个错误
            errors_html = f"""
            <div class="errors">
                <h4>错误信息</h4>
                <ul>{errors_list}</ul>
            </div>
            """
        
        return f"""
        <div class="test-section">
            <h2>📊 {test_result.name.title()} 测试</h2>
            <div class="test-content">
                <div class="test-grid">
                    <div class="test-metric">
                        <div class="label">总数</div>
                        <div class="value info">{test_result.total}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">通过</div>
                        <div class="value success">{test_result.passed}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">失败</div>
                        <div class="value failure">{test_result.failed}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">跳过</div>
                        <div class="value warning">{test_result.skipped}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">耗时</div>
                        <div class="value info">{test_result.duration:.1f}s</div>
                    </div>
                    {coverage_html}
                </div>
                {errors_html}
            </div>
        </div>
        """
    
    def _generate_security_section_html(self, security_results: Dict[str, Any]) -> str:
        """生成安全扫描部分HTML"""
        trivy = security_results.get('trivy', {})
        snyk = security_results.get('snyk', {})
        
        return f"""
        <div class="test-section">
            <h2>🔒 安全扫描</h2>
            <div class="test-content">
                <h3>Trivy 扫描</h3>
                <div class="test-grid">
                    <div class="test-metric">
                        <div class="label">状态</div>
                        <div class="value info">{trivy.get('status', 'unknown')}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">漏洞总数</div>
                        <div class="value warning">{trivy.get('vulnerabilities', 0)}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">高危</div>
                        <div class="value failure">{trivy.get('high', 0)}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">中危</div>
                        <div class="value warning">{trivy.get('medium', 0)}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">低危</div>
                        <div class="value info">{trivy.get('low', 0)}</div>
                    </div>
                </div>
            </div>
        </div>
        """
    
    def _generate_performance_section_html(self, performance_results: Dict[str, Any]) -> str:
        """生成性能测试部分HTML"""
        response_time = performance_results.get('response_time', {})
        
        return f"""
        <div class="test-section">
            <h2>⚡ 性能测试</h2>
            <div class="test-content">
                <div class="test-grid">
                    <div class="test-metric">
                        <div class="label">状态</div>
                        <div class="value info">{performance_results.get('status', 'unknown')}</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">平均响应时间</div>
                        <div class="value info">{response_time.get('avg', 0):.2f}ms</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">P95响应时间</div>
                        <div class="value warning">{response_time.get('p95', 0):.2f}ms</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">P99响应时间</div>
                        <div class="value failure">{response_time.get('p99', 0):.2f}ms</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">吞吐量</div>
                        <div class="value info">{performance_results.get('throughput', 0):.2f} req/s</div>
                    </div>
                    <div class="test-metric">
                        <div class="label">错误率</div>
                        <div class="value {'failure' if performance_results.get('error_rate', 0) > 0.01 else 'success'}">{performance_results.get('error_rate', 0):.2%}</div>
                    </div>
                </div>
            </div>
        </div>
        """
    
    def generate_json_report(self, summary: TestSummary) -> str:
        """生成JSON报告"""
        return json.dumps(asdict(summary), indent=2, ensure_ascii=False)
    
    def generate_markdown_report(self, summary: TestSummary) -> str:
        """生成Markdown报告"""
        pass_rate = (summary.total_passed / summary.total_tests * 100) if summary.total_tests > 0 else 0
        status_emoji = "✅" if summary.overall_status == "success" else "❌"
        
        markdown = f"""
# 🧪 PhoenixCoder 测试报告

**生成时间:** {summary.timestamp}

## 📊 总体概览

| 指标 | 值 |
|------|----|
| 总体状态 | {status_emoji} {summary.overall_status} |
| 总测试数 | {summary.total_tests} |
| 通过数 | {summary.total_passed} |
| 失败数 | {summary.total_failed} |
| 跳过数 | {summary.total_skipped} |
| 通过率 | {pass_rate:.1f}% |
| 覆盖率 | {summary.overall_coverage:.1f}% |
| 执行时间 | {summary.total_duration:.1f}s |

## 📋 详细结果

### 后端测试

| 指标 | 值 |
|------|----|
| 总数 | {summary.backend.total} |
| 通过 | {summary.backend.passed} |
| 失败 | {summary.backend.failed} |
| 跳过 | {summary.backend.skipped} |
| 覆盖率 | {summary.backend.coverage or 0:.1f}% |
| 耗时 | {summary.backend.duration:.1f}s |

### 前端测试

| 指标 | 值 |
|------|----|
| 总数 | {summary.frontend.total} |
| 通过 | {summary.frontend.passed} |
| 失败 | {summary.frontend.failed} |
| 跳过 | {summary.frontend.skipped} |
| 覆盖率 | {summary.frontend.coverage or 0:.1f}% |
| 耗时 | {summary.frontend.duration:.1f}s |

### 小程序测试

| 指标 | 值 |
|------|----|
| 总数 | {summary.miniprogram.total} |
| 通过 | {summary.miniprogram.passed} |
| 失败 | {summary.miniprogram.failed} |
| 跳过 | {summary.miniprogram.skipped} |
| 覆盖率 | {summary.miniprogram.coverage or 0:.1f}% |
| 耗时 | {summary.miniprogram.duration:.1f}s |

### E2E测试

| 指标 | 值 |
|------|----|
| 总数 | {summary.e2e.total} |
| 通过 | {summary.e2e.passed} |
| 失败 | {summary.e2e.failed} |
| 跳过 | {summary.e2e.skipped} |
| 耗时 | {summary.e2e.duration:.1f}s |

### 🔒 安全扫描

**Trivy扫描结果:**
- 状态: {summary.security.get('trivy', {}).get('status', 'unknown')}
- 漏洞总数: {summary.security.get('trivy', {}).get('vulnerabilities', 0)}
- 高危: {summary.security.get('trivy', {}).get('high', 0)}
- 中危: {summary.security.get('trivy', {}).get('medium', 0)}
- 低危: {summary.security.get('trivy', {}).get('low', 0)}

### ⚡ 性能测试

- 状态: {summary.performance.get('status', 'unknown')}
- 平均响应时间: {summary.performance.get('response_time', {}).get('avg', 0):.2f}ms
- P95响应时间: {summary.performance.get('response_time', {}).get('p95', 0):.2f}ms
- P99响应时间: {summary.performance.get('response_time', {}).get('p99', 0):.2f}ms
- 吞吐量: {summary.performance.get('throughput', 0):.2f} req/s
- 错误率: {summary.performance.get('error_rate', 0):.2%}

---

*报告由 PhoenixCoder 测试系统自动生成*
        """
        
        return markdown.strip()
    
    def generate_reports(self, formats: List[str]) -> Dict[str, str]:
        """生成指定格式的报告"""
        summary = self.generate_summary()
        reports = {}
        
        if 'html' in formats:
            html_content = self.generate_html_report(summary)
            html_file = self.output_dir / 'report.html'
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            reports['html'] = str(html_file)
        
        if 'json' in formats:
            json_content = self.generate_json_report(summary)
            json_file = self.output_dir / 'summary.json'
            with open(json_file, 'w', encoding='utf-8') as f:
                f.write(json_content)
            reports['json'] = str(json_file)
        
        if 'markdown' in formats:
            markdown_content = self.generate_markdown_report(summary)
            markdown_file = self.output_dir / 'report.md'
            with open(markdown_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            reports['markdown'] = str(markdown_file)
        
        return reports


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='生成PhoenixCoder测试报告')
    parser.add_argument('--artifacts-dir', required=True, help='测试结果目录')
    parser.add_argument('--output-dir', required=True, help='报告输出目录')
    parser.add_argument('--format', default='html,json,markdown', help='报告格式 (html,json,markdown)')
    
    args = parser.parse_args()
    
    # 解析格式
    formats = [f.strip() for f in args.format.split(',')]
    
    try:
        generator = TestReportGenerator(args.artifacts_dir, args.output_dir)
        reports = generator.generate_reports(formats)
        
        print("✅ 测试报告生成成功:")
        for format_name, file_path in reports.items():
            print(f"  {format_name.upper()}: {file_path}")
        
        # 检查测试状态
        summary = generator.generate_summary()
        if summary.overall_status != "success":
            print(f"\n❌ 测试失败: {summary.total_failed} 个测试失败")
            sys.exit(1)
        else:
            print(f"\n✅ 所有测试通过: {summary.total_passed}/{summary.total_tests}")
            
    except Exception as e:
        print(f"❌ 生成报告失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()