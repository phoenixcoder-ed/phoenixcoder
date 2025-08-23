#!/usr/bin/env python3
"""
PhoenixCoder 性能分析脚本
分析性能测试结果，生成性能报告和回归检测
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import logging
import statistics
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from jinja2 import Template
import numpy as np

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置中文字体和样式
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
sns.set_style("whitegrid")
sns.set_palette("husl")

class PerformanceAnalyzer:
    """性能分析器"""
    
    def __init__(self, results_dir: str, baseline_dir: str = None):
        self.results_dir = Path(results_dir)
        self.baseline_dir = Path(baseline_dir) if baseline_dir else None
        self.analysis_results = {}
        
    def load_performance_data(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """加载性能数据"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载性能数据失败 {file_path}: {e}")
            return None
    
    def load_baseline_data(self, service_name: str, test_type: str) -> Optional[Dict[str, Any]]:
        """加载基线数据"""
        if not self.baseline_dir or not self.baseline_dir.exists():
            return None
        
        baseline_file = self.baseline_dir / f"{service_name}-{test_type}-baseline.json"
        return self.load_performance_data(baseline_file)
    
    def analyze_backend_performance(self, data: Dict[str, Any], baseline: Dict[str, Any] = None) -> Dict[str, Any]:
        """分析后端性能数据"""
        analysis = {
            'service_name': data.get('service_name', 'unknown'),
            'test_type': 'backend',
            'timestamp': data.get('timestamp', ''),
            'environment': data.get('environment', 'unknown'),
            'metrics': {},
            'regression_detected': False,
            'improvements': [],
            'regressions': [],
            'recommendations': []
        }
        
        # 分析关键指标
        metrics = data.get('metrics', {})
        
        # 响应时间分析
        response_times = metrics.get('response_times', {})
        if response_times:
            analysis['metrics']['response_time'] = {
                'avg': response_times.get('avg', 0),
                'p50': response_times.get('p50', 0),
                'p95': response_times.get('p95', 0),
                'p99': response_times.get('p99', 0),
                'max': response_times.get('max', 0)
            }
        
        # 吞吐量分析
        throughput = metrics.get('throughput', {})
        if throughput:
            analysis['metrics']['throughput'] = {
                'rps': throughput.get('requests_per_second', 0),
                'total_requests': throughput.get('total_requests', 0),
                'duration': throughput.get('duration_seconds', 0)
            }
        
        # 错误率分析
        errors = metrics.get('errors', {})
        if errors:
            total_requests = throughput.get('total_requests', 1)
            error_count = errors.get('total_errors', 0)
            error_rate = (error_count / total_requests) * 100 if total_requests > 0 else 0
            
            analysis['metrics']['error_rate'] = {
                'percentage': error_rate,
                'total_errors': error_count,
                'error_types': errors.get('error_types', {})
            }
        
        # 系统资源分析
        system_metrics = metrics.get('system', {})
        if system_metrics:
            analysis['metrics']['system'] = {
                'cpu_usage': system_metrics.get('cpu_usage_percent', 0),
                'memory_usage': system_metrics.get('memory_usage_percent', 0),
                'disk_io': system_metrics.get('disk_io_percent', 0),
                'network_io': system_metrics.get('network_io_mbps', 0)
            }
        
        # 与基线比较
        if baseline:
            analysis.update(self._compare_with_baseline(analysis['metrics'], baseline.get('metrics', {})))
        
        # 生成建议
        analysis['recommendations'] = self._generate_backend_recommendations(analysis)
        
        return analysis
    
    def analyze_frontend_performance(self, data: Dict[str, Any], baseline: Dict[str, Any] = None) -> Dict[str, Any]:
        """分析前端性能数据"""
        analysis = {
            'app_name': data.get('app_name', 'unknown'),
            'test_type': 'frontend',
            'timestamp': data.get('timestamp', ''),
            'environment': data.get('environment', 'unknown'),
            'metrics': {},
            'regression_detected': False,
            'improvements': [],
            'regressions': [],
            'recommendations': []
        }
        
        # Lighthouse 指标分析
        lighthouse = data.get('lighthouse', {})
        if lighthouse:
            analysis['metrics']['lighthouse'] = {
                'performance': lighthouse.get('performance', 0),
                'accessibility': lighthouse.get('accessibility', 0),
                'best_practices': lighthouse.get('best_practices', 0),
                'seo': lighthouse.get('seo', 0)
            }
        
        # Core Web Vitals 分析
        core_vitals = data.get('core_web_vitals', {})
        if core_vitals:
            analysis['metrics']['core_web_vitals'] = {
                'lcp': core_vitals.get('largest_contentful_paint', 0),
                'fid': core_vitals.get('first_input_delay', 0),
                'cls': core_vitals.get('cumulative_layout_shift', 0),
                'fcp': core_vitals.get('first_contentful_paint', 0),
                'ttfb': core_vitals.get('time_to_first_byte', 0)
            }
        
        # 资源加载分析
        resources = data.get('resources', {})
        if resources:
            analysis['metrics']['resources'] = {
                'total_size': resources.get('total_size_kb', 0),
                'js_size': resources.get('javascript_size_kb', 0),
                'css_size': resources.get('css_size_kb', 0),
                'image_size': resources.get('image_size_kb', 0),
                'font_size': resources.get('font_size_kb', 0),
                'load_time': resources.get('load_time_ms', 0)
            }
        
        # 与基线比较
        if baseline:
            analysis.update(self._compare_with_baseline(analysis['metrics'], baseline.get('metrics', {})))
        
        # 生成建议
        analysis['recommendations'] = self._generate_frontend_recommendations(analysis)
        
        return analysis
    
    def analyze_e2e_performance(self, data: Dict[str, Any], baseline: Dict[str, Any] = None) -> Dict[str, Any]:
        """分析 E2E 性能数据"""
        analysis = {
            'test_suite': data.get('test_suite', 'unknown'),
            'test_type': 'e2e',
            'timestamp': data.get('timestamp', ''),
            'environment': data.get('environment', 'unknown'),
            'metrics': {},
            'regression_detected': False,
            'improvements': [],
            'regressions': [],
            'recommendations': []
        }
        
        # 场景执行时间分析
        scenarios = data.get('scenarios', {})
        if scenarios:
            scenario_metrics = {}
            for scenario_name, scenario_data in scenarios.items():
                scenario_metrics[scenario_name] = {
                    'total_duration': scenario_data.get('total_duration_ms', 0),
                    'steps': scenario_data.get('steps', {}),
                    'success_rate': scenario_data.get('success_rate', 0),
                    'error_count': scenario_data.get('error_count', 0)
                }
            
            analysis['metrics']['scenarios'] = scenario_metrics
        
        # 整体统计
        summary = data.get('summary', {})
        if summary:
            analysis['metrics']['summary'] = {
                'total_scenarios': summary.get('total_scenarios', 0),
                'passed_scenarios': summary.get('passed_scenarios', 0),
                'failed_scenarios': summary.get('failed_scenarios', 0),
                'avg_duration': summary.get('avg_duration_ms', 0),
                'total_duration': summary.get('total_duration_ms', 0)
            }
        
        # 与基线比较
        if baseline:
            analysis.update(self._compare_with_baseline(analysis['metrics'], baseline.get('metrics', {})))
        
        # 生成建议
        analysis['recommendations'] = self._generate_e2e_recommendations(analysis)
        
        return analysis
    
    def _compare_with_baseline(self, current_metrics: Dict[str, Any], baseline_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """与基线数据比较"""
        comparison = {
            'regression_detected': False,
            'improvements': [],
            'regressions': [],
            'changes': {}
        }
        
        # 定义回归阈值
        regression_thresholds = {
            'response_time': {'p95': 20, 'avg': 15},  # 响应时间增加超过 20%/15% 视为回归
            'throughput': {'rps': -10},  # 吞吐量下降超过 10% 视为回归
            'error_rate': {'percentage': 5},  # 错误率增加超过 5% 视为回归
            'lighthouse': {'performance': -5},  # Lighthouse 性能分数下降超过 5 分视为回归
            'core_web_vitals': {'lcp': 20, 'fid': 50, 'cls': 10}  # Core Web Vitals 恶化阈值
        }
        
        def compare_metric(current_value: float, baseline_value: float, threshold: float, higher_is_better: bool = False) -> Tuple[str, float]:
            """比较单个指标"""
            if baseline_value == 0:
                return 'no_baseline', 0
            
            change_percent = ((current_value - baseline_value) / baseline_value) * 100
            
            if higher_is_better:
                if change_percent < -threshold:
                    return 'regression', change_percent
                elif change_percent > threshold:
                    return 'improvement', change_percent
            else:
                if change_percent > threshold:
                    return 'regression', change_percent
                elif change_percent < -threshold:
                    return 'improvement', change_percent
            
            return 'stable', change_percent
        
        # 比较各类指标
        for metric_category, current_data in current_metrics.items():
            if metric_category not in baseline_metrics:
                continue
            
            baseline_data = baseline_metrics[metric_category]
            category_changes = {}
            
            if metric_category == 'response_time':
                for key, current_val in current_data.items():
                    if key in baseline_data and key in regression_thresholds['response_time']:
                        threshold = regression_thresholds['response_time'][key]
                        status, change = compare_metric(current_val, baseline_data[key], threshold)
                        category_changes[key] = {'status': status, 'change_percent': change, 'current': current_val, 'baseline': baseline_data[key]}
                        
                        if status == 'regression':
                            comparison['regressions'].append(f"响应时间 {key} 增加了 {change:.1f}% ({baseline_data[key]:.0f}ms -> {current_val:.0f}ms)")
                            comparison['regression_detected'] = True
                        elif status == 'improvement':
                            comparison['improvements'].append(f"响应时间 {key} 改善了 {abs(change):.1f}% ({baseline_data[key]:.0f}ms -> {current_val:.0f}ms)")
            
            elif metric_category == 'throughput':
                if 'rps' in current_data and 'rps' in baseline_data:
                    threshold = abs(regression_thresholds['throughput']['rps'])
                    status, change = compare_metric(current_data['rps'], baseline_data['rps'], threshold, higher_is_better=True)
                    category_changes['rps'] = {'status': status, 'change_percent': change, 'current': current_data['rps'], 'baseline': baseline_data['rps']}
                    
                    if status == 'regression':
                        comparison['regressions'].append(f"吞吐量下降了 {abs(change):.1f}% ({baseline_data['rps']:.0f} -> {current_data['rps']:.0f} RPS)")
                        comparison['regression_detected'] = True
                    elif status == 'improvement':
                        comparison['improvements'].append(f"吞吐量提升了 {change:.1f}% ({baseline_data['rps']:.0f} -> {current_data['rps']:.0f} RPS)")
            
            elif metric_category == 'error_rate':
                if 'percentage' in current_data and 'percentage' in baseline_data:
                    threshold = regression_thresholds['error_rate']['percentage']
                    current_val = current_data['percentage']
                    baseline_val = baseline_data['percentage']
                    change = current_val - baseline_val
                    
                    category_changes['percentage'] = {'status': 'stable', 'change_absolute': change, 'current': current_val, 'baseline': baseline_val}
                    
                    if change > threshold:
                        category_changes['percentage']['status'] = 'regression'
                        comparison['regressions'].append(f"错误率增加了 {change:.1f}% ({baseline_val:.1f}% -> {current_val:.1f}%)")
                        comparison['regression_detected'] = True
                    elif change < -threshold:
                        category_changes['percentage']['status'] = 'improvement'
                        comparison['improvements'].append(f"错误率降低了 {abs(change):.1f}% ({baseline_val:.1f}% -> {current_val:.1f}%)")
            
            elif metric_category == 'lighthouse':
                for key, current_val in current_data.items():
                    if key in baseline_data:
                        threshold = abs(regression_thresholds['lighthouse']['performance'])
                        status, change = compare_metric(current_val, baseline_data[key], threshold, higher_is_better=True)
                        category_changes[key] = {'status': status, 'change_percent': change, 'current': current_val, 'baseline': baseline_data[key]}
                        
                        if status == 'regression':
                            comparison['regressions'].append(f"Lighthouse {key} 分数下降了 {abs(change):.1f}% ({baseline_data[key]:.0f} -> {current_val:.0f})")
                            comparison['regression_detected'] = True
                        elif status == 'improvement':
                            comparison['improvements'].append(f"Lighthouse {key} 分数提升了 {change:.1f}% ({baseline_data[key]:.0f} -> {current_val:.0f})")
            
            comparison['changes'][metric_category] = category_changes
        
        return comparison
    
    def _generate_backend_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """生成后端性能建议"""
        recommendations = []
        metrics = analysis.get('metrics', {})
        
        # 响应时间建议
        response_time = metrics.get('response_time', {})
        if response_time.get('p95', 0) > 1000:  # P95 超过 1 秒
            recommendations.append("P95 响应时间超过 1 秒，建议优化数据库查询和缓存策略")
        
        if response_time.get('avg', 0) > 500:  # 平均响应时间超过 500ms
            recommendations.append("平均响应时间较高，建议检查慢查询和 API 性能瓶颈")
        
        # 吞吐量建议
        throughput = metrics.get('throughput', {})
        if throughput.get('rps', 0) < 100:  # RPS 低于 100
            recommendations.append("吞吐量较低，建议优化应用性能和增加并发处理能力")
        
        # 错误率建议
        error_rate = metrics.get('error_rate', {})
        if error_rate.get('percentage', 0) > 1:  # 错误率超过 1%
            recommendations.append("错误率较高，建议检查错误日志和异常处理")
        
        # 系统资源建议
        system = metrics.get('system', {})
        if system.get('cpu_usage', 0) > 80:
            recommendations.append("CPU 使用率过高，建议优化算法或增加计算资源")
        
        if system.get('memory_usage', 0) > 85:
            recommendations.append("内存使用率过高，建议检查内存泄漏和优化内存使用")
        
        # 回归建议
        if analysis.get('regression_detected'):
            recommendations.append("检测到性能回归，建议回滚最近的代码变更或进行性能优化")
        
        return recommendations
    
    def _generate_frontend_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """生成前端性能建议"""
        recommendations = []
        metrics = analysis.get('metrics', {})
        
        # Lighthouse 建议
        lighthouse = metrics.get('lighthouse', {})
        if lighthouse.get('performance', 0) < 90:
            recommendations.append("Lighthouse 性能分数较低，建议优化资源加载和渲染性能")
        
        if lighthouse.get('accessibility', 0) < 90:
            recommendations.append("可访问性分数较低，建议改善无障碍设计")
        
        # Core Web Vitals 建议
        vitals = metrics.get('core_web_vitals', {})
        if vitals.get('lcp', 0) > 2500:  # LCP 超过 2.5 秒
            recommendations.append("LCP 过长，建议优化关键资源加载和服务器响应时间")
        
        if vitals.get('fid', 0) > 100:  # FID 超过 100ms
            recommendations.append("FID 过长，建议优化 JavaScript 执行和减少主线程阻塞")
        
        if vitals.get('cls', 0) > 0.1:  # CLS 超过 0.1
            recommendations.append("CLS 过高，建议为图片和广告预留空间，避免布局偏移")
        
        # 资源大小建议
        resources = metrics.get('resources', {})
        if resources.get('total_size', 0) > 3000:  # 总大小超过 3MB
            recommendations.append("资源总大小过大，建议压缩图片、代码分割和启用 gzip")
        
        if resources.get('js_size', 0) > 1000:  # JS 大小超过 1MB
            recommendations.append("JavaScript 文件过大，建议进行代码分割和 Tree Shaking")
        
        # 回归建议
        if analysis.get('regression_detected'):
            recommendations.append("检测到前端性能回归，建议检查最近的代码变更和资源优化")
        
        return recommendations
    
    def _generate_e2e_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """生成 E2E 性能建议"""
        recommendations = []
        metrics = analysis.get('metrics', {})
        
        # 场景执行时间建议
        scenarios = metrics.get('scenarios', {})
        for scenario_name, scenario_data in scenarios.items():
            duration = scenario_data.get('total_duration', 0)
            if duration > 30000:  # 超过 30 秒
                recommendations.append(f"场景 '{scenario_name}' 执行时间过长 ({duration/1000:.1f}s)，建议优化测试步骤")
            
            success_rate = scenario_data.get('success_rate', 0)
            if success_rate < 95:  # 成功率低于 95%
                recommendations.append(f"场景 '{scenario_name}' 成功率较低 ({success_rate:.1f}%)，建议检查测试稳定性")
        
        # 整体统计建议
        summary = metrics.get('summary', {})
        if summary.get('failed_scenarios', 0) > 0:
            failed_count = summary.get('failed_scenarios', 0)
            total_count = summary.get('total_scenarios', 1)
            failure_rate = (failed_count / total_count) * 100
            recommendations.append(f"有 {failed_count} 个场景失败 ({failure_rate:.1f}%)，建议检查失败原因")
        
        avg_duration = summary.get('avg_duration', 0)
        if avg_duration > 15000:  # 平均执行时间超过 15 秒
            recommendations.append(f"平均场景执行时间过长 ({avg_duration/1000:.1f}s)，建议优化测试效率")
        
        # 回归建议
        if analysis.get('regression_detected'):
            recommendations.append("检测到 E2E 性能回归，建议检查应用性能和测试环境")
        
        return recommendations
    
    def generate_performance_charts(self, analyses: List[Dict[str, Any]], output_dir: str) -> List[str]:
        """生成性能图表"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        chart_files = []
        
        # 按测试类型分组
        backend_analyses = [a for a in analyses if a.get('test_type') == 'backend']
        frontend_analyses = [a for a in analyses if a.get('test_type') == 'frontend']
        e2e_analyses = [a for a in analyses if a.get('test_type') == 'e2e']
        
        # 生成后端性能图表
        if backend_analyses:
            chart_file = self._generate_backend_charts(backend_analyses, output_path)
            if chart_file:
                chart_files.append(chart_file)
        
        # 生成前端性能图表
        if frontend_analyses:
            chart_file = self._generate_frontend_charts(frontend_analyses, output_path)
            if chart_file:
                chart_files.append(chart_file)
        
        # 生成 E2E 性能图表
        if e2e_analyses:
            chart_file = self._generate_e2e_charts(e2e_analyses, output_path)
            if chart_file:
                chart_files.append(chart_file)
        
        return chart_files
    
    def _generate_backend_charts(self, analyses: List[Dict[str, Any]], output_path: Path) -> Optional[str]:
        """生成后端性能图表"""
        try:
            fig, axes = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle('后端性能分析', fontsize=16, fontweight='bold')
            
            # 提取数据
            services = []
            response_times = []
            throughputs = []
            error_rates = []
            cpu_usages = []
            
            for analysis in analyses:
                service_name = analysis.get('service_name', 'Unknown')
                metrics = analysis.get('metrics', {})
                
                services.append(service_name)
                response_times.append(metrics.get('response_time', {}).get('p95', 0))
                throughputs.append(metrics.get('throughput', {}).get('rps', 0))
                error_rates.append(metrics.get('error_rate', {}).get('percentage', 0))
                cpu_usages.append(metrics.get('system', {}).get('cpu_usage', 0))
            
            # 响应时间图表
            axes[0, 0].bar(services, response_times, color='skyblue')
            axes[0, 0].set_title('P95 响应时间 (ms)')
            axes[0, 0].set_ylabel('响应时间 (ms)')
            axes[0, 0].tick_params(axis='x', rotation=45)
            
            # 吞吐量图表
            axes[0, 1].bar(services, throughputs, color='lightgreen')
            axes[0, 1].set_title('吞吐量 (RPS)')
            axes[0, 1].set_ylabel('请求/秒')
            axes[0, 1].tick_params(axis='x', rotation=45)
            
            # 错误率图表
            axes[1, 0].bar(services, error_rates, color='lightcoral')
            axes[1, 0].set_title('错误率 (%)')
            axes[1, 0].set_ylabel('错误率 (%)')
            axes[1, 0].tick_params(axis='x', rotation=45)
            
            # CPU 使用率图表
            axes[1, 1].bar(services, cpu_usages, color='orange')
            axes[1, 1].set_title('CPU 使用率 (%)')
            axes[1, 1].set_ylabel('CPU 使用率 (%)')
            axes[1, 1].tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            
            chart_file = output_path / 'backend-performance.png'
            plt.savefig(chart_file, dpi=300, bbox_inches='tight')
            plt.close()
            
            return str(chart_file)
            
        except Exception as e:
            logger.error(f"生成后端性能图表失败: {e}")
            return None
    
    def _generate_frontend_charts(self, analyses: List[Dict[str, Any]], output_path: Path) -> Optional[str]:
        """生成前端性能图表"""
        try:
            fig, axes = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle('前端性能分析', fontsize=16, fontweight='bold')
            
            # 提取数据
            apps = []
            lighthouse_scores = []
            lcp_values = []
            fid_values = []
            cls_values = []
            
            for analysis in analyses:
                app_name = analysis.get('app_name', 'Unknown')
                metrics = analysis.get('metrics', {})
                
                apps.append(app_name)
                lighthouse = metrics.get('lighthouse', {})
                lighthouse_scores.append([
                    lighthouse.get('performance', 0),
                    lighthouse.get('accessibility', 0),
                    lighthouse.get('best_practices', 0),
                    lighthouse.get('seo', 0)
                ])
                
                vitals = metrics.get('core_web_vitals', {})
                lcp_values.append(vitals.get('lcp', 0))
                fid_values.append(vitals.get('fid', 0))
                cls_values.append(vitals.get('cls', 0))
            
            # Lighthouse 分数雷达图
            if lighthouse_scores:
                categories = ['Performance', 'Accessibility', 'Best Practices', 'SEO']
                
                # 计算平均分数
                avg_scores = [statistics.mean([scores[i] for scores in lighthouse_scores]) for i in range(4)]
                
                angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
                avg_scores += avg_scores[:1]  # 闭合图形
                angles += angles[:1]
                
                ax = plt.subplot(2, 2, 1, projection='polar')
                ax.plot(angles, avg_scores, 'o-', linewidth=2, color='blue')
                ax.fill(angles, avg_scores, alpha=0.25, color='blue')
                ax.set_xticks(angles[:-1])
                ax.set_xticklabels(categories)
                ax.set_ylim(0, 100)
                ax.set_title('Lighthouse 平均分数')
            
            # LCP 图表
            axes[0, 1].bar(apps, lcp_values, color='orange')
            axes[0, 1].set_title('Largest Contentful Paint (ms)')
            axes[0, 1].set_ylabel('LCP (ms)')
            axes[0, 1].tick_params(axis='x', rotation=45)
            axes[0, 1].axhline(y=2500, color='red', linestyle='--', alpha=0.7, label='Poor (>2.5s)')
            axes[0, 1].axhline(y=4000, color='orange', linestyle='--', alpha=0.7, label='Needs Improvement (>4s)')
            
            # FID 图表
            axes[1, 0].bar(apps, fid_values, color='green')
            axes[1, 0].set_title('First Input Delay (ms)')
            axes[1, 0].set_ylabel('FID (ms)')
            axes[1, 0].tick_params(axis='x', rotation=45)
            axes[1, 0].axhline(y=100, color='red', linestyle='--', alpha=0.7, label='Poor (>100ms)')
            axes[1, 0].axhline(y=300, color='orange', linestyle='--', alpha=0.7, label='Needs Improvement (>300ms)')
            
            # CLS 图表
            axes[1, 1].bar(apps, cls_values, color='purple')
            axes[1, 1].set_title('Cumulative Layout Shift')
            axes[1, 1].set_ylabel('CLS')
            axes[1, 1].tick_params(axis='x', rotation=45)
            axes[1, 1].axhline(y=0.1, color='red', linestyle='--', alpha=0.7, label='Poor (>0.1)')
            axes[1, 1].axhline(y=0.25, color='orange', linestyle='--', alpha=0.7, label='Needs Improvement (>0.25)')
            
            plt.tight_layout()
            
            chart_file = output_path / 'frontend-performance.png'
            plt.savefig(chart_file, dpi=300, bbox_inches='tight')
            plt.close()
            
            return str(chart_file)
            
        except Exception as e:
            logger.error(f"生成前端性能图表失败: {e}")
            return None
    
    def _generate_e2e_charts(self, analyses: List[Dict[str, Any]], output_path: Path) -> Optional[str]:
        """生成 E2E 性能图表"""
        try:
            fig, axes = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle('E2E 性能分析', fontsize=16, fontweight='bold')
            
            # 提取数据
            test_suites = []
            avg_durations = []
            success_rates = []
            scenario_counts = []
            
            all_scenarios = {}
            
            for analysis in analyses:
                suite_name = analysis.get('test_suite', 'Unknown')
                metrics = analysis.get('metrics', {})
                
                test_suites.append(suite_name)
                
                summary = metrics.get('summary', {})
                avg_durations.append(summary.get('avg_duration', 0) / 1000)  # 转换为秒
                
                total_scenarios = summary.get('total_scenarios', 0)
                passed_scenarios = summary.get('passed_scenarios', 0)
                success_rate = (passed_scenarios / total_scenarios * 100) if total_scenarios > 0 else 0
                success_rates.append(success_rate)
                scenario_counts.append(total_scenarios)
                
                # 收集所有场景数据
                scenarios = metrics.get('scenarios', {})
                for scenario_name, scenario_data in scenarios.items():
                    if scenario_name not in all_scenarios:
                        all_scenarios[scenario_name] = []
                    all_scenarios[scenario_name].append(scenario_data.get('total_duration', 0) / 1000)
            
            # 平均执行时间图表
            axes[0, 0].bar(test_suites, avg_durations, color='skyblue')
            axes[0, 0].set_title('平均场景执行时间 (秒)')
            axes[0, 0].set_ylabel('执行时间 (秒)')
            axes[0, 0].tick_params(axis='x', rotation=45)
            
            # 成功率图表
            colors = ['green' if rate >= 95 else 'orange' if rate >= 90 else 'red' for rate in success_rates]
            axes[0, 1].bar(test_suites, success_rates, color=colors)
            axes[0, 1].set_title('测试成功率 (%)')
            axes[0, 1].set_ylabel('成功率 (%)')
            axes[0, 1].set_ylim(0, 100)
            axes[0, 1].tick_params(axis='x', rotation=45)
            axes[0, 1].axhline(y=95, color='green', linestyle='--', alpha=0.7, label='目标 (95%)')
            
            # 场景数量图表
            axes[1, 0].bar(test_suites, scenario_counts, color='lightgreen')
            axes[1, 0].set_title('测试场景数量')
            axes[1, 0].set_ylabel('场景数量')
            axes[1, 0].tick_params(axis='x', rotation=45)
            
            # 各场景执行时间对比
            if all_scenarios:
                scenario_names = list(all_scenarios.keys())[:10]  # 只显示前 10 个场景
                scenario_avg_times = [statistics.mean(all_scenarios[name]) for name in scenario_names]
                
                axes[1, 1].barh(scenario_names, scenario_avg_times, color='orange')
                axes[1, 1].set_title('各场景平均执行时间 (秒)')
                axes[1, 1].set_xlabel('执行时间 (秒)')
            
            plt.tight_layout()
            
            chart_file = output_path / 'e2e-performance.png'
            plt.savefig(chart_file, dpi=300, bbox_inches='tight')
            plt.close()
            
            return str(chart_file)
            
        except Exception as e:
            logger.error(f"生成 E2E 性能图表失败: {e}")
            return None
    
    def generate_performance_report(self, analyses: List[Dict[str, Any]], output_file: str, chart_files: List[str] = None) -> None:
        """生成性能报告"""
        # 报告模板
        report_template = Template("""
# PhoenixCoder 性能测试报告

**生成时间:** {{ generation_time }}
**测试环境:** {{ environment }}
**测试周期:** {{ test_period }}

## 📊 总体概览

{% if summary %}
- **总测试数:** {{ summary.total_tests }}
- **回归检测:** {{ summary.regressions_detected }} 个
- **性能改进:** {{ summary.improvements_detected }} 个
- **整体状态:** {{ summary.overall_status }}
{% endif %}

## 🚀 后端服务性能

{% for analysis in backend_analyses %}
### {{ analysis.service_name }}

**测试时间:** {{ analysis.timestamp }}

#### 关键指标
{% if analysis.metrics.response_time %}
- **响应时间:**
  - 平均: {{ "%.0f" | format(analysis.metrics.response_time.avg) }}ms
  - P95: {{ "%.0f" | format(analysis.metrics.response_time.p95) }}ms
  - P99: {{ "%.0f" | format(analysis.metrics.response_time.p99) }}ms
{% endif %}

{% if analysis.metrics.throughput %}
- **吞吐量:** {{ "%.0f" | format(analysis.metrics.throughput.rps) }} RPS
{% endif %}

{% if analysis.metrics.error_rate %}
- **错误率:** {{ "%.2f" | format(analysis.metrics.error_rate.percentage) }}%
{% endif %}

{% if analysis.metrics.system %}
- **系统资源:**
  - CPU: {{ "%.1f" | format(analysis.metrics.system.cpu_usage) }}%
  - 内存: {{ "%.1f" | format(analysis.metrics.system.memory_usage) }}%
{% endif %}

#### 性能变化
{% if analysis.improvements %}
**✅ 改进:**
{% for improvement in analysis.improvements %}
- {{ improvement }}
{% endfor %}
{% endif %}

{% if analysis.regressions %}
**⚠️ 回归:**
{% for regression in analysis.regressions %}
- {{ regression }}
{% endfor %}
{% endif %}

#### 建议
{% for recommendation in analysis.recommendations %}
- {{ recommendation }}
{% endfor %}

---
{% endfor %}

## 🌐 前端应用性能

{% for analysis in frontend_analyses %}
### {{ analysis.app_name }}

**测试时间:** {{ analysis.timestamp }}

#### Lighthouse 分数
{% if analysis.metrics.lighthouse %}
- **性能:** {{ analysis.metrics.lighthouse.performance }}/100
- **可访问性:** {{ analysis.metrics.lighthouse.accessibility }}/100
- **最佳实践:** {{ analysis.metrics.lighthouse.best_practices }}/100
- **SEO:** {{ analysis.metrics.lighthouse.seo }}/100
{% endif %}

#### Core Web Vitals
{% if analysis.metrics.core_web_vitals %}
- **LCP:** {{ "%.0f" | format(analysis.metrics.core_web_vitals.lcp) }}ms
- **FID:** {{ "%.0f" | format(analysis.metrics.core_web_vitals.fid) }}ms
- **CLS:** {{ "%.3f" | format(analysis.metrics.core_web_vitals.cls) }}
{% endif %}

#### 资源大小
{% if analysis.metrics.resources %}
- **总大小:** {{ "%.0f" | format(analysis.metrics.resources.total_size) }}KB
- **JavaScript:** {{ "%.0f" | format(analysis.metrics.resources.js_size) }}KB
- **CSS:** {{ "%.0f" | format(analysis.metrics.resources.css_size) }}KB
- **图片:** {{ "%.0f" | format(analysis.metrics.resources.image_size) }}KB
{% endif %}

#### 性能变化
{% if analysis.improvements %}
**✅ 改进:**
{% for improvement in analysis.improvements %}
- {{ improvement }}
{% endfor %}
{% endif %}

{% if analysis.regressions %}
**⚠️ 回归:**
{% for regression in analysis.regressions %}
- {{ regression }}
{% endfor %}
{% endif %}

#### 建议
{% for recommendation in analysis.recommendations %}
- {{ recommendation }}
{% endfor %}

---
{% endfor %}

## 🔄 E2E 测试性能

{% for analysis in e2e_analyses %}
### {{ analysis.test_suite }}

**测试时间:** {{ analysis.timestamp }}

#### 执行统计
{% if analysis.metrics.summary %}
- **总场景数:** {{ analysis.metrics.summary.total_scenarios }}
- **通过场景:** {{ analysis.metrics.summary.passed_scenarios }}
- **失败场景:** {{ analysis.metrics.summary.failed_scenarios }}
- **平均执行时间:** {{ "%.1f" | format(analysis.metrics.summary.avg_duration / 1000) }}秒
- **总执行时间:** {{ "%.1f" | format(analysis.metrics.summary.total_duration / 1000) }}秒
{% endif %}

#### 场景详情
{% if analysis.metrics.scenarios %}
{% for scenario_name, scenario_data in analysis.metrics.scenarios.items() %}
- **{{ scenario_name }}:** {{ "%.1f" | format(scenario_data.total_duration / 1000) }}秒 (成功率: {{ "%.1f" | format(scenario_data.success_rate) }}%)
{% endfor %}
{% endif %}

#### 性能变化
{% if analysis.improvements %}
**✅ 改进:**
{% for improvement in analysis.improvements %}
- {{ improvement }}
{% endfor %}
{% endif %}

{% if analysis.regressions %}
**⚠️ 回归:**
{% for regression in analysis.regressions %}
- {{ regression }}
{% endfor %}
{% endif %}

#### 建议
{% for recommendation in analysis.recommendations %}
- {{ recommendation }}
{% endfor %}

---
{% endfor %}

## 📈 性能图表

{% if chart_files %}
{% for chart_file in chart_files %}
![性能图表]({{ chart_file }})
{% endfor %}
{% endif %}

## 🎯 总体建议

{% if overall_recommendations %}
{% for recommendation in overall_recommendations %}
- {{ recommendation }}
{% endfor %}
{% endif %}

---

*报告由 PhoenixCoder 性能分析器自动生成*
        """)
        
        # 分类分析结果
        backend_analyses = [a for a in analyses if a.get('test_type') == 'backend']
        frontend_analyses = [a for a in analyses if a.get('test_type') == 'frontend']
        e2e_analyses = [a for a in analyses if a.get('test_type') == 'e2e']
        
        # 生成总体统计
        total_tests = len(analyses)
        regressions_detected = sum(1 for a in analyses if a.get('regression_detected'))
        improvements_detected = sum(1 for a in analyses if a.get('improvements'))
        
        overall_status = "良好"
        if regressions_detected > 0:
            overall_status = "需要关注"
        elif improvements_detected > 0:
            overall_status = "持续改进"
        
        summary = {
            'total_tests': total_tests,
            'regressions_detected': regressions_detected,
            'improvements_detected': improvements_detected,
            'overall_status': overall_status
        }
        
        # 生成总体建议
        overall_recommendations = []
        if regressions_detected > 0:
            overall_recommendations.append(f"检测到 {regressions_detected} 个性能回归，建议优先处理")
        
        if improvements_detected > 0:
            overall_recommendations.append(f"发现 {improvements_detected} 个性能改进，继续保持")
        
        # 检查是否有高风险问题
        high_risk_issues = []
        for analysis in analyses:
            if analysis.get('test_type') == 'backend':
                metrics = analysis.get('metrics', {})
                if metrics.get('error_rate', {}).get('percentage', 0) > 5:
                    high_risk_issues.append(f"{analysis.get('service_name')} 错误率过高")
            elif analysis.get('test_type') == 'frontend':
                metrics = analysis.get('metrics', {})
                if metrics.get('lighthouse', {}).get('performance', 100) < 70:
                    high_risk_issues.append(f"{analysis.get('app_name')} Lighthouse 性能分数过低")
        
        if high_risk_issues:
            overall_recommendations.extend([f"高风险问题: {issue}" for issue in high_risk_issues])
        
        # 渲染报告
        report_content = report_template.render(
            generation_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            environment='测试环境',
            test_period='当前测试周期',
            summary=summary,
            backend_analyses=backend_analyses,
            frontend_analyses=frontend_analyses,
            e2e_analyses=e2e_analyses,
            chart_files=chart_files or [],
            overall_recommendations=overall_recommendations
        )
        
        # 保存报告
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        logger.info(f"性能报告已生成: {output_file}")
    
    def analyze_all_results(self) -> List[Dict[str, Any]]:
        """分析所有性能测试结果"""
        analyses = []
        
        if not self.results_dir.exists():
            logger.warning(f"结果目录不存在: {self.results_dir}")
            return analyses
        
        # 查找所有性能测试结果文件
        result_files = list(self.results_dir.glob('**/*.json'))
        
        for result_file in result_files:
            logger.info(f"分析文件: {result_file}")
            
            data = self.load_performance_data(result_file)
            if not data:
                continue
            
            # 根据文件名或数据内容判断测试类型
            test_type = self._determine_test_type(result_file, data)
            
            if test_type == 'backend':
                # 加载基线数据
                service_name = data.get('service_name', result_file.stem)
                baseline = self.load_baseline_data(service_name, 'backend')
                analysis = self.analyze_backend_performance(data, baseline)
            elif test_type == 'frontend':
                app_name = data.get('app_name', result_file.stem)
                baseline = self.load_baseline_data(app_name, 'frontend')
                analysis = self.analyze_frontend_performance(data, baseline)
            elif test_type == 'e2e':
                test_suite = data.get('test_suite', result_file.stem)
                baseline = self.load_baseline_data(test_suite, 'e2e')
                analysis = self.analyze_e2e_performance(data, baseline)
            else:
                logger.warning(f"无法确定测试类型: {result_file}")
                continue
            
            analyses.append(analysis)
        
        return analyses
    
    def _determine_test_type(self, file_path: Path, data: Dict[str, Any]) -> str:
        """确定测试类型"""
        # 根据文件名判断
        file_name = file_path.name.lower()
        if 'backend' in file_name or 'server' in file_name or 'api' in file_name:
            return 'backend'
        elif 'frontend' in file_name or 'lighthouse' in file_name or 'web' in file_name:
            return 'frontend'
        elif 'e2e' in file_name or 'playwright' in file_name:
            return 'e2e'
        
        # 根据数据内容判断
        if 'service_name' in data or 'response_times' in data.get('metrics', {}):
            return 'backend'
        elif 'app_name' in data or 'lighthouse' in data:
            return 'frontend'
        elif 'test_suite' in data or 'scenarios' in data.get('metrics', {}):
            return 'e2e'
        
        return 'unknown'

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='PhoenixCoder 性能分析器')
    parser.add_argument('--results-dir', required=True, help='性能测试结果目录')
    parser.add_argument('--baseline-dir', help='性能基线数据目录')
    parser.add_argument('--output-dir', default='performance-analysis', help='分析结果输出目录')
    parser.add_argument('--report-file', default='performance-report.md', help='性能报告文件名')
    parser.add_argument('--generate-charts', action='store_true', help='生成性能图表')
    
    args = parser.parse_args()
    
    # 创建性能分析器
    analyzer = PerformanceAnalyzer(args.results_dir, args.baseline_dir)
    
    try:
        # 分析所有结果
        logger.info("开始分析性能测试结果...")
        analyses = analyzer.analyze_all_results()
        
        if not analyses:
            logger.warning("没有找到有效的性能测试结果")
            return
        
        logger.info(f"分析了 {len(analyses)} 个性能测试结果")
        
        # 创建输出目录
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存分析结果
        analysis_file = output_dir / 'analysis-results.json'
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump(analyses, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"分析结果已保存: {analysis_file}")
        
        # 生成图表
        chart_files = []
        if args.generate_charts:
            logger.info("生成性能图表...")
            chart_files = analyzer.generate_performance_charts(analyses, str(output_dir))
            logger.info(f"生成了 {len(chart_files)} 个图表文件")
        
        # 生成报告
        report_file = output_dir / args.report_file
        logger.info("生成性能报告...")
        analyzer.generate_performance_report(analyses, str(report_file), chart_files)
        
        # 输出统计信息
        regressions = sum(1 for a in analyses if a.get('regression_detected'))
        improvements = sum(1 for a in analyses if a.get('improvements'))
        
        logger.info(f"性能分析完成:")
        logger.info(f"  总测试数: {len(analyses)}")
        logger.info(f"  检测到回归: {regressions}")
        logger.info(f"  发现改进: {improvements}")
        
        # 如果检测到回归，返回非零退出码
        if regressions > 0:
            logger.warning(f"检测到 {regressions} 个性能回归！")
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"性能分析失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()