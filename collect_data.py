#!/usr/bin/env python3
"""
工作流数据收集脚本
用于收集和分析GitHub Actions工作流运行数据
"""

import json
import requests
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any


def get_workflow_runs(repo: str, token: str, days: int = 1) -> List[Dict[str, Any]]:
    """获取指定天数内的工作流运行数据"""
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    url = f'https://api.github.com/repos/{repo}/actions/runs'
    params = {'created': f'>{since}', 'per_page': 100}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json().get('workflow_runs', [])
    except requests.RequestException as e:
        print(f"❌ 获取工作流数据失败: {e}")
        return []


def analyze_workflows(runs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """分析工作流运行数据"""
    stats = {
        'total_runs': len(runs),
        'successful_runs': 0,
        'failed_runs': 0,
        'cancelled_runs': 0,
        'in_progress_runs': 0,
        'workflows': {},
        'branches': {},
        'authors': {},
        'duration_stats': {
            'total_duration': 0,
            'avg_duration': 0,
            'max_duration': 0,
            'min_duration': float('inf')
        }
    }
    
    total_duration = 0
    duration_count = 0
    
    for run in runs:
        conclusion = run.get('conclusion')
        status = run.get('status')
        
        # 统计运行状态
        if conclusion == 'success':
            stats['successful_runs'] += 1
        elif conclusion == 'failure':
            stats['failed_runs'] += 1
        elif conclusion == 'cancelled':
            stats['cancelled_runs'] += 1
        elif status == 'in_progress':
            stats['in_progress_runs'] += 1
        
        # 按工作流统计
        workflow_name = run.get('name', 'Unknown')
        if workflow_name not in stats['workflows']:
            stats['workflows'][workflow_name] = {
                'success': 0, 'failure': 0, 'cancelled': 0, 'in_progress': 0,
                'total_runs': 0, 'avg_duration': 0
            }
        
        stats['workflows'][workflow_name]['total_runs'] += 1
        if conclusion:
            stats['workflows'][workflow_name][conclusion] += 1
        elif status == 'in_progress':
            stats['workflows'][workflow_name]['in_progress'] += 1
        
        # 按分支统计
        branch = run.get('head_branch', 'Unknown')
        if branch not in stats['branches']:
            stats['branches'][branch] = {
                'success': 0, 'failure': 0, 'cancelled': 0, 'in_progress': 0,
                'total_runs': 0
            }
        
        stats['branches'][branch]['total_runs'] += 1
        if conclusion:
            stats['branches'][branch][conclusion] += 1
        elif status == 'in_progress':
            stats['branches'][branch]['in_progress'] += 1
        
        # 按作者统计
        author = 'Unknown'
        if run.get('head_commit') and run['head_commit'].get('author'):
            author = run['head_commit']['author'].get('name', 'Unknown')
        
        if author not in stats['authors']:
            stats['authors'][author] = {
                'success': 0, 'failure': 0, 'cancelled': 0, 'in_progress': 0,
                'total_runs': 0
            }
        
        stats['authors'][author]['total_runs'] += 1
        if conclusion:
            stats['authors'][author][conclusion] += 1
        elif status == 'in_progress':
            stats['authors'][author]['in_progress'] += 1
        
        # 计算运行时长统计
        if run.get('created_at') and run.get('updated_at'):
            try:
                created = datetime.fromisoformat(run['created_at'].replace('Z', '+00:00'))
                updated = datetime.fromisoformat(run['updated_at'].replace('Z', '+00:00'))
                duration = (updated - created).total_seconds()
                
                if duration > 0:
                    total_duration += duration
                    duration_count += 1
                    
                    stats['duration_stats']['total_duration'] += duration
                    stats['duration_stats']['max_duration'] = max(
                        stats['duration_stats']['max_duration'], duration
                    )
                    stats['duration_stats']['min_duration'] = min(
                        stats['duration_stats']['min_duration'], duration
                    )
            except (ValueError, TypeError):
                continue
    
    # 计算平均时长
    if duration_count > 0:
        stats['duration_stats']['avg_duration'] = total_duration / duration_count
    
    if stats['duration_stats']['min_duration'] == float('inf'):
        stats['duration_stats']['min_duration'] = 0
    
    # 计算成功率
    stats['success_rate'] = (
        stats['successful_runs'] / stats['total_runs'] * 100
        if stats['total_runs'] > 0 else 0
    )
    
    return stats


def generate_summary_report(stats: Dict[str, Any]) -> str:
    """生成摘要报告"""
    report = f"""
📊 工作流数据分析报告

🔢 总体统计:
- 总运行次数: {stats['total_runs']}
- 成功运行: {stats['successful_runs']}
- 失败运行: {stats['failed_runs']}
- 取消运行: {stats['cancelled_runs']}
- 进行中: {stats['in_progress_runs']}
- 成功率: {stats['success_rate']:.1f}%

⏱️ 运行时长统计:
- 平均时长: {stats['duration_stats']['avg_duration']:.0f}秒
- 最长时长: {stats['duration_stats']['max_duration']:.0f}秒
- 最短时长: {stats['duration_stats']['min_duration']:.0f}秒

🔧 工作流统计:
"""
    
    for workflow, data in stats['workflows'].items():
        success_rate = (data['success'] / data['total_runs'] * 100) if data['total_runs'] > 0 else 0
        report += f"- {workflow}: {data['total_runs']}次运行, 成功率{success_rate:.1f}%\n"
    
    report += "\n🌿 分支统计:\n"
    for branch, data in stats['branches'].items():
        success_rate = (data['success'] / data['total_runs'] * 100) if data['total_runs'] > 0 else 0
        report += f"- {branch}: {data['total_runs']}次运行, 成功率{success_rate:.1f}%\n"
    
    report += "\n👥 作者统计:\n"
    for author, data in stats['authors'].items():
        success_rate = (data['success'] / data['total_runs'] * 100) if data['total_runs'] > 0 else 0
        report += f"- {author}: {data['total_runs']}次运行, 成功率{success_rate:.1f}%\n"
    
    return report


def main():
    """主函数"""
    # 获取环境变量
    repo = os.environ.get('GITHUB_REPOSITORY')
    token = os.environ.get('GITHUB_TOKEN')
    
    if not repo or not token:
        print("❌ 缺少必要的环境变量: GITHUB_REPOSITORY 或 GITHUB_TOKEN")
        return
    
    print(f"📊 开始收集 {repo} 的工作流数据...")
    
    # 获取工作流运行数据
    runs = get_workflow_runs(repo, token, days=7)  # 获取最近7天的数据
    
    if not runs:
        print("⚠️ 未找到工作流运行数据")
        return
    
    print(f"📋 找到 {len(runs)} 个工作流运行记录")
    
    # 分析数据
    stats = analyze_workflows(runs)
    
    # 生成报告
    report = generate_summary_report(stats)
    print(report)
    
    # 保存数据
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'repository': repo,
        'stats': stats,
        'raw_runs': runs[:10]  # 只保存前10个运行记录作为样本
    }
    
    with open('workflow_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    # 保存摘要报告
    with open('workflow_summary.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n📝 数据已保存到 workflow_data.json")
    print(f"📝 摘要报告已保存到 workflow_summary.md")
    
    # 设置GitHub Actions输出
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write(f"workflow_data={json.dumps(stats)}\n")
            f.write(f"success_rate={stats['success_rate']:.1f}\n")
            f.write(f"total_runs={stats['total_runs']}\n")


if __name__ == '__main__':
    main()