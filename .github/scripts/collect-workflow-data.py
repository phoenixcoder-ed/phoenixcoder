#!/usr/bin/env python3
"""
PhoenixCoder CI/CD 工作流数据收集脚本
收集和分析 GitHub Actions 工作流运行数据
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging
from collections import defaultdict
import statistics

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WorkflowDataCollector:
    """工作流数据收集器"""
    
    def __init__(self, github_token: str, repository: str):
        self.github_token = github_token
        self.repository = repository
        self.base_url = 'https://api.github.com'
        self.headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """发送 GitHub API 请求"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API 请求失败 {endpoint}: {e}")
            return None
    
    def _paginate_request(self, endpoint: str, params: Dict = None, max_pages: int = 10) -> List[Dict]:
        """分页请求数据"""
        all_data = []
        page = 1
        
        while page <= max_pages:
            request_params = params.copy() if params else {}
            request_params.update({'page': page, 'per_page': 100})
            
            data = self._make_request(endpoint, request_params)
            if not data:
                break
            
            # 处理不同的响应格式
            if isinstance(data, dict):
                items = data.get('workflow_runs', data.get('workflows', data.get('items', [])))
                if not items:
                    break
                all_data.extend(items)
                
                # 检查是否还有更多页面
                if len(items) < 100:
                    break
            elif isinstance(data, list):
                all_data.extend(data)
                if len(data) < 100:
                    break
            else:
                break
            
            page += 1
        
        return all_data
    
    def get_workflows(self) -> List[Dict]:
        """获取所有工作流"""
        endpoint = f'/repos/{self.repository}/actions/workflows'
        data = self._make_request(endpoint)
        
        if data and 'workflows' in data:
            return data['workflows']
        return []
    
    def get_workflow_runs(self, workflow_id: Optional[int] = None, 
                         since: Optional[datetime] = None,
                         until: Optional[datetime] = None,
                         branch: Optional[str] = None,
                         status: Optional[str] = None) -> List[Dict]:
        """获取工作流运行记录"""
        if workflow_id:
            endpoint = f'/repos/{self.repository}/actions/workflows/{workflow_id}/runs'
        else:
            endpoint = f'/repos/{self.repository}/actions/runs'
        
        params = {}
        
        if since:
            params['created'] = f'>={since.isoformat()}'
        
        if branch:
            params['branch'] = branch
        
        if status:
            params['status'] = status
        
        runs = self._paginate_request(endpoint, params)
        
        # 过滤时间范围
        if until:
            runs = [
                run for run in runs 
                if datetime.fromisoformat(run['created_at'].replace('Z', '+00:00')) <= until
            ]
        
        return runs
    
    def get_workflow_run_jobs(self, run_id: int) -> List[Dict]:
        """获取工作流运行的作业详情"""
        endpoint = f'/repos/{self.repository}/actions/runs/{run_id}/jobs'
        data = self._make_request(endpoint)
        
        if data and 'jobs' in data:
            return data['jobs']
        return []
    
    def analyze_workflow_stats(self, runs: List[Dict]) -> Dict[str, Any]:
        """分析工作流统计数据"""
        if not runs:
            return {
                'total_runs': 0,
                'successful_runs': 0,
                'failed_runs': 0,
                'cancelled_runs': 0,
                'success_rate': 0,
                'avg_duration': 0,
                'workflows': {},
                'branches': {},
                'authors': {},
                'daily_stats': {},
                'hourly_stats': {}
            }
        
        total_runs = len(runs)
        successful_runs = len([r for r in runs if r['conclusion'] == 'success'])
        failed_runs = len([r for r in runs if r['conclusion'] == 'failure'])
        cancelled_runs = len([r for r in runs if r['conclusion'] == 'cancelled'])
        
        success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0
        
        # 计算平均持续时间
        durations = []
        for run in runs:
            if run.get('created_at') and run.get('updated_at'):
                created = datetime.fromisoformat(run['created_at'].replace('Z', '+00:00'))
                updated = datetime.fromisoformat(run['updated_at'].replace('Z', '+00:00'))
                duration = (updated - created).total_seconds()
                durations.append(duration)
        
        avg_duration = statistics.mean(durations) if durations else 0
        
        # 按工作流分组统计
        workflow_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'failure': 0, 'cancelled': 0})
        for run in runs:
            workflow_name = run.get('name', 'Unknown')
            workflow_stats[workflow_name]['total'] += 1
            if run['conclusion'] == 'success':
                workflow_stats[workflow_name]['success'] += 1
            elif run['conclusion'] == 'failure':
                workflow_stats[workflow_name]['failure'] += 1
            elif run['conclusion'] == 'cancelled':
                workflow_stats[workflow_name]['cancelled'] += 1
        
        # 计算每个工作流的成功率
        for workflow_name, stats in workflow_stats.items():
            if stats['total'] > 0:
                stats['success_rate'] = (stats['success'] / stats['total']) * 100
            else:
                stats['success_rate'] = 0
        
        # 按分支分组统计
        branch_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'failure': 0})
        for run in runs:
            branch = run.get('head_branch', 'unknown')
            branch_stats[branch]['total'] += 1
            if run['conclusion'] == 'success':
                branch_stats[branch]['success'] += 1
            elif run['conclusion'] == 'failure':
                branch_stats[branch]['failure'] += 1
        
        # 按作者分组统计
        author_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'failure': 0})
        for run in runs:
            author = run.get('head_commit', {}).get('author', {}).get('name', 'unknown')
            author_stats[author]['total'] += 1
            if run['conclusion'] == 'success':
                author_stats[author]['success'] += 1
            elif run['conclusion'] == 'failure':
                author_stats[author]['failure'] += 1
        
        # 按日期分组统计
        daily_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'failure': 0})
        for run in runs:
            created_date = datetime.fromisoformat(run['created_at'].replace('Z', '+00:00')).date()
            date_str = created_date.isoformat()
            daily_stats[date_str]['total'] += 1
            if run['conclusion'] == 'success':
                daily_stats[date_str]['success'] += 1
            elif run['conclusion'] == 'failure':
                daily_stats[date_str]['failure'] += 1
        
        # 按小时分组统计
        hourly_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'failure': 0})
        for run in runs:
            created_hour = datetime.fromisoformat(run['created_at'].replace('Z', '+00:00')).hour
            hourly_stats[created_hour]['total'] += 1
            if run['conclusion'] == 'success':
                hourly_stats[created_hour]['success'] += 1
            elif run['conclusion'] == 'failure':
                hourly_stats[created_hour]['failure'] += 1
        
        return {
            'total_runs': total_runs,
            'successful_runs': successful_runs,
            'failed_runs': failed_runs,
            'cancelled_runs': cancelled_runs,
            'success_rate': round(success_rate, 2),
            'avg_duration': round(avg_duration, 2),
            'workflows': dict(workflow_stats),
            'branches': dict(branch_stats),
            'authors': dict(author_stats),
            'daily_stats': dict(daily_stats),
            'hourly_stats': dict(hourly_stats)
        }
    
    def get_repository_info(self) -> Dict[str, Any]:
        """获取仓库信息"""
        endpoint = f'/repos/{self.repository}'
        data = self._make_request(endpoint)
        
        if data:
            return {
                'name': data.get('name', ''),
                'full_name': data.get('full_name', ''),
                'description': data.get('description', ''),
                'language': data.get('language', ''),
                'stars': data.get('stargazers_count', 0),
                'forks': data.get('forks_count', 0),
                'open_issues': data.get('open_issues_count', 0),
                'default_branch': data.get('default_branch', 'main'),
                'created_at': data.get('created_at', ''),
                'updated_at': data.get('updated_at', ''),
                'size': data.get('size', 0),
                'license': data.get('license', {}).get('name', '') if data.get('license') else ''
            }
        return {}
    
    def get_pull_requests_stats(self, since: Optional[datetime] = None) -> Dict[str, Any]:
        """获取 PR 统计数据"""
        endpoint = f'/repos/{self.repository}/pulls'
        params = {'state': 'all'}
        
        if since:
            params['since'] = since.isoformat()
        
        prs = self._paginate_request(endpoint, params)
        
        if since:
            prs = [
                pr for pr in prs 
                if datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00')) >= since
            ]
        
        total_prs = len(prs)
        open_prs = len([pr for pr in prs if pr['state'] == 'open'])
        closed_prs = len([pr for pr in prs if pr['state'] == 'closed'])
        merged_prs = len([pr for pr in prs if pr.get('merged_at')])
        
        return {
            'total_prs': total_prs,
            'open_prs': open_prs,
            'closed_prs': closed_prs,
            'merged_prs': merged_prs,
            'merge_rate': (merged_prs / total_prs * 100) if total_prs > 0 else 0
        }
    
    def get_issues_stats(self, since: Optional[datetime] = None) -> Dict[str, Any]:
        """获取 Issue 统计数据"""
        endpoint = f'/repos/{self.repository}/issues'
        params = {'state': 'all'}
        
        if since:
            params['since'] = since.isoformat()
        
        issues = self._paginate_request(endpoint, params)
        
        # 过滤掉 PR（GitHub API 中 PR 也被当作 Issue）
        issues = [issue for issue in issues if not issue.get('pull_request')]
        
        if since:
            issues = [
                issue for issue in issues 
                if datetime.fromisoformat(issue['created_at'].replace('Z', '+00:00')) >= since
            ]
        
        total_issues = len(issues)
        open_issues = len([issue for issue in issues if issue['state'] == 'open'])
        closed_issues = len([issue for issue in issues if issue['state'] == 'closed'])
        
        return {
            'total_issues': total_issues,
            'open_issues': open_issues,
            'closed_issues': closed_issues,
            'close_rate': (closed_issues / total_issues * 100) if total_issues > 0 else 0
        }
    
    def collect_comprehensive_data(self, days: int = 30) -> Dict[str, Any]:
        """收集综合数据"""
        since = datetime.now() - timedelta(days=days)
        
        logger.info(f"收集过去 {days} 天的数据...")
        
        # 获取基础信息
        repo_info = self.get_repository_info()
        
        # 获取工作流运行数据
        workflow_runs = self.get_workflow_runs(since=since)
        workflow_stats = self.analyze_workflow_stats(workflow_runs)
        
        # 获取 PR 和 Issue 统计
        pr_stats = self.get_pull_requests_stats(since=since)
        issue_stats = self.get_issues_stats(since=since)
        
        # 获取工作流列表
        workflows = self.get_workflows()
        
        return {
            'collection_date': datetime.now().isoformat(),
            'period_days': days,
            'repository': repo_info,
            'workflow_stats': workflow_stats,
            'pr_stats': pr_stats,
            'issue_stats': issue_stats,
            'workflows': workflows,
            'raw_runs': workflow_runs[:100]  # 只保留最近 100 条运行记录
        }
    
    def save_data(self, data: Dict[str, Any], output_path: str) -> None:
        """保存数据到文件"""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"数据已保存到: {output_path}")
    
    def generate_summary_report(self, data: Dict[str, Any]) -> str:
        """生成摘要报告"""
        workflow_stats = data.get('workflow_stats', {})
        pr_stats = data.get('pr_stats', {})
        issue_stats = data.get('issue_stats', {})
        
        report = f"""
# PhoenixCoder CI/CD 数据摘要报告

**生成时间:** {data.get('collection_date', '')}
**统计周期:** 过去 {data.get('period_days', 0)} 天

## 工作流统计

- **总运行次数:** {workflow_stats.get('total_runs', 0)}
- **成功次数:** {workflow_stats.get('successful_runs', 0)}
- **失败次数:** {workflow_stats.get('failed_runs', 0)}
- **取消次数:** {workflow_stats.get('cancelled_runs', 0)}
- **成功率:** {workflow_stats.get('success_rate', 0)}%
- **平均持续时间:** {workflow_stats.get('avg_duration', 0):.0f} 秒

## 各工作流表现

"""
        
        workflows = workflow_stats.get('workflows', {})
        for workflow_name, stats in workflows.items():
            report += f"- **{workflow_name}:** {stats['success']}/{stats['total']} 成功 ({stats.get('success_rate', 0):.1f}%)\n"
        
        report += f"""

## Pull Request 统计

- **总 PR 数:** {pr_stats.get('total_prs', 0)}
- **开放中:** {pr_stats.get('open_prs', 0)}
- **已关闭:** {pr_stats.get('closed_prs', 0)}
- **已合并:** {pr_stats.get('merged_prs', 0)}
- **合并率:** {pr_stats.get('merge_rate', 0):.1f}%

## Issue 统计

- **总 Issue 数:** {issue_stats.get('total_issues', 0)}
- **开放中:** {issue_stats.get('open_issues', 0)}
- **已关闭:** {issue_stats.get('closed_issues', 0)}
- **关闭率:** {issue_stats.get('close_rate', 0):.1f}%

---
*报告由 PhoenixCoder CI/CD 数据收集器自动生成*
"""
        
        return report

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='PhoenixCoder CI/CD 工作流数据收集器')
    parser.add_argument('--repository', required=True, help='GitHub 仓库 (格式: owner/repo)')
    parser.add_argument('--token', help='GitHub Token (也可通过 GITHUB_TOKEN 环境变量设置)')
    parser.add_argument('--days', type=int, default=30, help='收集数据的天数 (默认: 30)')
    parser.add_argument('--output', default='workflow-data.json', help='输出文件路径')
    parser.add_argument('--report', help='生成摘要报告文件路径')
    
    args = parser.parse_args()
    
    # 获取 GitHub Token
    github_token = args.token or os.getenv('GITHUB_TOKEN')
    if not github_token:
        logger.error("GitHub Token 未提供，请使用 --token 参数或设置 GITHUB_TOKEN 环境变量")
        sys.exit(1)
    
    # 创建数据收集器
    collector = WorkflowDataCollector(github_token, args.repository)
    
    try:
        # 收集数据
        data = collector.collect_comprehensive_data(args.days)
        
        # 保存数据
        collector.save_data(data, args.output)
        
        # 生成报告（如果指定）
        if args.report:
            report = collector.generate_summary_report(data)
            with open(args.report, 'w', encoding='utf-8') as f:
                f.write(report)
            logger.info(f"摘要报告已保存到: {args.report}")
        
        # 输出基本统计
        workflow_stats = data.get('workflow_stats', {})
        logger.info(f"数据收集完成:")
        logger.info(f"  总运行次数: {workflow_stats.get('total_runs', 0)}")
        logger.info(f"  成功率: {workflow_stats.get('success_rate', 0)}%")
        logger.info(f"  工作流数量: {len(data.get('workflows', []))}")
        
    except Exception as e:
        logger.error(f"数据收集失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()