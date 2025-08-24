#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Actions CI/CD 状态检查脚本
用于监控和验证 CI/CD 流程的运行状态
"""

import os
import sys
import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import argparse
from pathlib import Path


class GitHubActionsMonitor:
    """GitHub Actions 监控器"""
    
    def __init__(self, token: str, repo: str, owner: str):
        self.token = token
        self.repo = repo
        self.owner = owner
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CI-Status-Check/1.0"
        }
        
    def get_workflow_runs(self, workflow_id: Optional[str] = None, 
                         branch: Optional[str] = None, 
                         limit: int = 10) -> List[Dict[str, Any]]:
        """获取工作流运行记录"""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/actions/runs"
        params = {
            "per_page": limit,
            "status": "completed"
        }
        
        if workflow_id:
            params["workflow_id"] = workflow_id
        if branch:
            params["branch"] = branch
            
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json().get("workflow_runs", [])
        except requests.RequestException as e:
            print(f"❌ 获取工作流运行记录失败: {e}")
            return []
    
    def get_workflow_run_details(self, run_id: int) -> Optional[Dict[str, Any]]:
        """获取工作流运行详情"""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/actions/runs/{run_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ 获取工作流运行详情失败: {e}")
            return None
    
    def get_workflow_run_jobs(self, run_id: int) -> List[Dict[str, Any]]:
        """获取工作流运行的作业列表"""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/actions/runs/{run_id}/jobs"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get("jobs", [])
        except requests.RequestException as e:
            print(f"❌ 获取工作流作业列表失败: {e}")
            return []
    
    def get_workflow_artifacts(self, run_id: int) -> List[Dict[str, Any]]:
        """获取工作流产物"""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/actions/runs/{run_id}/artifacts"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get("artifacts", [])
        except requests.RequestException as e:
            print(f"❌ 获取工作流产物失败: {e}")
            return []
    
    def get_workflows(self) -> List[Dict[str, Any]]:
        """获取所有工作流"""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/actions/workflows"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get("workflows", [])
        except requests.RequestException as e:
            print(f"❌ 获取工作流列表失败: {e}")
            return []


class CIStatusChecker:
    """CI/CD 状态检查器"""
    
    def __init__(self, monitor: GitHubActionsMonitor):
        self.monitor = monitor
        self.report_data = {
            "timestamp": datetime.now().isoformat(),
            "repository": f"{monitor.owner}/{monitor.repo}",
            "workflows": [],
            "summary": {},
            "recommendations": [],
            "badges": {}
        }
    
    def check_workflow_health(self, days: int = 7) -> Dict[str, Any]:
        """检查工作流健康状态"""
        print(f"🔍 检查过去 {days} 天的工作流健康状态...")
        
        # 获取所有工作流
        workflows = self.monitor.get_workflows()
        
        workflow_health = {}
        
        for workflow in workflows:
            workflow_id = workflow["id"]
            workflow_name = workflow["name"]
            
            print(f"  📋 检查工作流: {workflow_name}")
            
            # 获取最近的运行记录
            runs = self.monitor.get_workflow_runs(
                workflow_id=workflow_id, 
                limit=20
            )
            
            # 过滤最近几天的运行记录
            cutoff_date = datetime.now() - timedelta(days=days)
            recent_runs = [
                run for run in runs 
                if datetime.fromisoformat(run["created_at"].replace("Z", "+00:00")) > cutoff_date
            ]
            
            if not recent_runs:
                workflow_health[workflow_name] = {
                    "status": "inactive",
                    "total_runs": 0,
                    "success_rate": 0,
                    "avg_duration": 0,
                    "last_run": None,
                    "issues": ["工作流在指定时间内没有运行"]
                }
                continue
            
            # 计算成功率
            successful_runs = [run for run in recent_runs if run["conclusion"] == "success"]
            failed_runs = [run for run in recent_runs if run["conclusion"] == "failure"]
            cancelled_runs = [run for run in recent_runs if run["conclusion"] == "cancelled"]
            
            success_rate = len(successful_runs) / len(recent_runs) * 100 if recent_runs else 0
            
            # 计算平均持续时间
            durations = []
            for run in recent_runs:
                if run["created_at"] and run["updated_at"]:
                    created = datetime.fromisoformat(run["created_at"].replace("Z", "+00:00"))
                    updated = datetime.fromisoformat(run["updated_at"].replace("Z", "+00:00"))
                    duration = (updated - created).total_seconds()
                    durations.append(duration)
            
            avg_duration = sum(durations) / len(durations) if durations else 0
            
            # 识别问题
            issues = []
            if success_rate < 80:
                issues.append(f"成功率较低: {success_rate:.1f}%")
            if len(failed_runs) > 3:
                issues.append(f"失败次数过多: {len(failed_runs)} 次")
            if avg_duration > 3600:  # 超过1小时
                issues.append(f"平均运行时间过长: {avg_duration/60:.1f} 分钟")
            
            # 检查最近失败的运行
            recent_failures = [run for run in recent_runs[:5] if run["conclusion"] == "failure"]
            if recent_failures:
                issues.append(f"最近有 {len(recent_failures)} 次失败")
            
            workflow_health[workflow_name] = {
                "status": "healthy" if success_rate >= 80 and not issues else "warning" if success_rate >= 60 else "critical",
                "total_runs": len(recent_runs),
                "successful_runs": len(successful_runs),
                "failed_runs": len(failed_runs),
                "cancelled_runs": len(cancelled_runs),
                "success_rate": round(success_rate, 2),
                "avg_duration": round(avg_duration, 2),
                "avg_duration_minutes": round(avg_duration / 60, 2),
                "last_run": recent_runs[0] if recent_runs else None,
                "issues": issues,
                "recent_failures": recent_failures[:3]  # 最近3次失败
            }
        
        return workflow_health
    
    def analyze_job_performance(self, run_id: int) -> Dict[str, Any]:
        """分析作业性能"""
        print(f"📊 分析运行 {run_id} 的作业性能...")
        
        jobs = self.monitor.get_workflow_run_jobs(run_id)
        
        job_analysis = {
            "total_jobs": len(jobs),
            "successful_jobs": 0,
            "failed_jobs": 0,
            "cancelled_jobs": 0,
            "jobs": [],
            "bottlenecks": [],
            "recommendations": []
        }
        
        for job in jobs:
            job_duration = 0
            if job.get("started_at") and job.get("completed_at"):
                started = datetime.fromisoformat(job["started_at"].replace("Z", "+00:00"))
                completed = datetime.fromisoformat(job["completed_at"].replace("Z", "+00:00"))
                job_duration = (completed - started).total_seconds()
            
            job_info = {
                "name": job["name"],
                "status": job["status"],
                "conclusion": job["conclusion"],
                "duration_seconds": job_duration,
                "duration_minutes": round(job_duration / 60, 2),
                "runner_name": job.get("runner_name", "unknown"),
                "steps_count": len(job.get("steps", [])),
                "url": job["html_url"]
            }
            
            job_analysis["jobs"].append(job_info)
            
            # 统计作业状态
            if job["conclusion"] == "success":
                job_analysis["successful_jobs"] += 1
            elif job["conclusion"] == "failure":
                job_analysis["failed_jobs"] += 1
            elif job["conclusion"] == "cancelled":
                job_analysis["cancelled_jobs"] += 1
            
            # 识别瓶颈
            if job_duration > 1800:  # 超过30分钟
                job_analysis["bottlenecks"].append({
                    "job": job["name"],
                    "duration_minutes": round(job_duration / 60, 2),
                    "issue": "运行时间过长"
                })
        
        # 生成建议
        if job_analysis["bottlenecks"]:
            job_analysis["recommendations"].append(
                "考虑优化长时间运行的作业，使用缓存或并行化"
            )
        
        if job_analysis["failed_jobs"] > 0:
            job_analysis["recommendations"].append(
                "检查失败的作业日志，修复相关问题"
            )
        
        return job_analysis
    
    def check_artifacts_and_reports(self, run_id: int) -> Dict[str, Any]:
        """检查产物和报告"""
        print(f"📦 检查运行 {run_id} 的产物和报告...")
        
        artifacts = self.monitor.get_workflow_artifacts(run_id)
        
        artifact_analysis = {
            "total_artifacts": len(artifacts),
            "artifacts": [],
            "missing_reports": [],
            "recommendations": []
        }
        
        expected_artifacts = [
            "coverage-report",
            "build-artifacts",
            "security-report-staging",
            "security-report-production"
        ]
        
        found_artifacts = []
        
        for artifact in artifacts:
            artifact_info = {
                "name": artifact["name"],
                "size_bytes": artifact["size_in_bytes"],
                "size_mb": round(artifact["size_in_bytes"] / 1024 / 1024, 2),
                "created_at": artifact["created_at"],
                "expired": artifact["expired"],
                "download_url": artifact.get("archive_download_url")
            }
            
            artifact_analysis["artifacts"].append(artifact_info)
            found_artifacts.append(artifact["name"])
        
        # 检查缺失的报告
        for expected in expected_artifacts:
            if not any(expected in name for name in found_artifacts):
                artifact_analysis["missing_reports"].append(expected)
        
        # 生成建议
        if artifact_analysis["missing_reports"]:
            artifact_analysis["recommendations"].append(
                f"缺少重要报告: {', '.join(artifact_analysis['missing_reports'])}"
            )
        
        # 检查产物大小
        large_artifacts = [a for a in artifact_analysis["artifacts"] if a["size_mb"] > 100]
        if large_artifacts:
            artifact_analysis["recommendations"].append(
                f"发现大型产物 (>100MB): {', '.join([a['name'] for a in large_artifacts])}"
            )
        
        return artifact_analysis
    
    def generate_status_badges(self, workflow_health: Dict[str, Any]) -> Dict[str, str]:
        """生成状态徽章"""
        print("🏷️ 生成状态徽章...")
        
        badges = {}
        
        # 总体健康状态徽章
        healthy_workflows = sum(1 for w in workflow_health.values() if w["status"] == "healthy")
        total_workflows = len(workflow_health)
        
        if total_workflows == 0:
            overall_status = "unknown"
            overall_color = "lightgrey"
        elif healthy_workflows == total_workflows:
            overall_status = "passing"
            overall_color = "brightgreen"
        elif healthy_workflows >= total_workflows * 0.8:
            overall_status = "mostly-passing"
            overall_color = "yellow"
        else:
            overall_status = "failing"
            overall_color = "red"
        
        badges["overall"] = f"https://img.shields.io/badge/CI%2FCD-{overall_status}-{overall_color}"
        
        # 为每个工作流生成徽章
        for workflow_name, health in workflow_health.items():
            status = health["status"]
            success_rate = health["success_rate"]
            
            if status == "healthy":
                color = "brightgreen"
                label = f"{success_rate:.0f}%25"
            elif status == "warning":
                color = "yellow"
                label = f"{success_rate:.0f}%25"
            elif status == "critical":
                color = "red"
                label = f"{success_rate:.0f}%25"
            else:  # inactive
                color = "lightgrey"
                label = "inactive"
            
            # 清理工作流名称用于URL
            clean_name = workflow_name.replace(" ", "%20").replace("/", "%2F")
            badges[workflow_name] = f"https://img.shields.io/badge/{clean_name}-{label}-{color}"
        
        return badges
    
    def generate_detailed_report(self, workflow_health: Dict[str, Any], 
                               job_analysis: Optional[Dict[str, Any]] = None,
                               artifact_analysis: Optional[Dict[str, Any]] = None) -> str:
        """生成详细报告"""
        print("📝 生成详细报告...")
        
        report = []
        report.append("# 🔍 CI/CD 流程状态报告\n")
        report.append(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.append(f"**仓库**: {self.monitor.owner}/{self.monitor.repo}\n")
        
        # 总体状态
        healthy_count = sum(1 for w in workflow_health.values() if w["status"] == "healthy")
        warning_count = sum(1 for w in workflow_health.values() if w["status"] == "warning")
        critical_count = sum(1 for w in workflow_health.values() if w["status"] == "critical")
        inactive_count = sum(1 for w in workflow_health.values() if w["status"] == "inactive")
        
        report.append("## 📊 总体状态\n")
        report.append(f"- ✅ 健康工作流: {healthy_count}")
        report.append(f"- ⚠️ 警告工作流: {warning_count}")
        report.append(f"- ❌ 严重问题工作流: {critical_count}")
        report.append(f"- 💤 非活跃工作流: {inactive_count}\n")
        
        # 工作流详情
        report.append("## 🔧 工作流详情\n")
        report.append("| 工作流 | 状态 | 成功率 | 运行次数 | 平均时长 | 问题 |")
        report.append("|--------|------|--------|----------|----------|------|")
        
        for workflow_name, health in workflow_health.items():
            status_emoji = {
                "healthy": "✅",
                "warning": "⚠️",
                "critical": "❌",
                "inactive": "💤"
            }.get(health["status"], "❓")
            
            issues_text = "; ".join(health["issues"]) if health["issues"] else "无"
            
            report.append(
                f"| {workflow_name} | {status_emoji} {health['status']} | "
                f"{health['success_rate']:.1f}% | {health['total_runs']} | "
                f"{health['avg_duration_minutes']:.1f}min | {issues_text} |"
            )
        
        report.append("\n")
        
        # 作业分析（如果提供）
        if job_analysis:
            report.append("## 📊 作业性能分析\n")
            report.append(f"- 总作业数: {job_analysis['total_jobs']}")
            report.append(f"- 成功作业: {job_analysis['successful_jobs']}")
            report.append(f"- 失败作业: {job_analysis['failed_jobs']}")
            report.append(f"- 取消作业: {job_analysis['cancelled_jobs']}\n")
            
            if job_analysis["bottlenecks"]:
                report.append("### 🐌 性能瓶颈\n")
                for bottleneck in job_analysis["bottlenecks"]:
                    report.append(f"- **{bottleneck['job']}**: {bottleneck['duration_minutes']:.1f}分钟 - {bottleneck['issue']}")
                report.append("\n")
        
        # 产物分析（如果提供）
        if artifact_analysis:
            report.append("## 📦 产物和报告\n")
            report.append(f"- 总产物数: {artifact_analysis['total_artifacts']}\n")
            
            if artifact_analysis["missing_reports"]:
                report.append("### ❌ 缺失报告\n")
                for missing in artifact_analysis["missing_reports"]:
                    report.append(f"- {missing}")
                report.append("\n")
        
        # 建议
        all_recommendations = []
        for health in workflow_health.values():
            if health["status"] != "healthy":
                all_recommendations.append(f"修复 {health.get('name', '未知')} 工作流的问题")
        
        if job_analysis and job_analysis["recommendations"]:
            all_recommendations.extend(job_analysis["recommendations"])
        
        if artifact_analysis and artifact_analysis["recommendations"]:
            all_recommendations.extend(artifact_analysis["recommendations"])
        
        if all_recommendations:
            report.append("## 💡 建议\n")
            for i, rec in enumerate(all_recommendations, 1):
                report.append(f"{i}. {rec}")
            report.append("\n")
        
        return "\n".join(report)
    
    def run_full_check(self, days: int = 7, latest_run_analysis: bool = True) -> Dict[str, Any]:
        """运行完整检查"""
        print("🚀 开始完整的 CI/CD 状态检查...\n")
        
        # 检查工作流健康状态
        workflow_health = self.check_workflow_health(days)
        
        # 分析最新运行的作业性能
        job_analysis = None
        artifact_analysis = None
        
        if latest_run_analysis:
            # 获取最新的运行
            latest_runs = self.monitor.get_workflow_runs(limit=1)
            if latest_runs:
                latest_run = latest_runs[0]
                run_id = latest_run["id"]
                
                print(f"\n📊 分析最新运行 (ID: {run_id})...")
                job_analysis = self.analyze_job_performance(run_id)
                artifact_analysis = self.check_artifacts_and_reports(run_id)
        
        # 生成徽章
        badges = self.generate_status_badges(workflow_health)
        
        # 生成详细报告
        detailed_report = self.generate_detailed_report(
            workflow_health, job_analysis, artifact_analysis
        )
        
        # 汇总结果
        self.report_data.update({
            "workflows": workflow_health,
            "job_analysis": job_analysis,
            "artifact_analysis": artifact_analysis,
            "badges": badges,
            "detailed_report": detailed_report,
            "summary": {
                "total_workflows": len(workflow_health),
                "healthy_workflows": sum(1 for w in workflow_health.values() if w["status"] == "healthy"),
                "warning_workflows": sum(1 for w in workflow_health.values() if w["status"] == "warning"),
                "critical_workflows": sum(1 for w in workflow_health.values() if w["status"] == "critical"),
                "inactive_workflows": sum(1 for w in workflow_health.values() if w["status"] == "inactive")
            }
        })
        
        return self.report_data
    
    def save_report(self, output_dir: str = "ci-reports") -> None:
        """保存报告"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # 保存JSON报告
        json_file = output_path / "ci-status-report.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(self.report_data, f, indent=2, ensure_ascii=False)
        
        # 保存Markdown报告
        md_file = output_path / "ci-status-report.md"
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(self.report_data["detailed_report"])
        
        # 保存徽章信息
        badges_file = output_path / "badges.json"
        with open(badges_file, "w", encoding="utf-8") as f:
            json.dump(self.report_data["badges"], f, indent=2)
        
        print(f"\n📁 报告已保存到 {output_dir}/")
        print(f"  - JSON报告: {json_file}")
        print(f"  - Markdown报告: {md_file}")
        print(f"  - 徽章信息: {badges_file}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="GitHub Actions CI/CD 状态检查")
    parser.add_argument("--token", required=True, help="GitHub Personal Access Token")
    parser.add_argument("--repo", required=True, help="仓库名称")
    parser.add_argument("--owner", required=True, help="仓库所有者")
    parser.add_argument("--days", type=int, default=7, help="检查天数 (默认: 7)")
    parser.add_argument("--output", default="ci-reports", help="输出目录 (默认: ci-reports)")
    parser.add_argument("--no-job-analysis", action="store_true", help="跳过作业分析")
    
    args = parser.parse_args()
    
    # 创建监控器
    monitor = GitHubActionsMonitor(args.token, args.repo, args.owner)
    
    # 创建检查器
    checker = CIStatusChecker(monitor)
    
    try:
        # 运行完整检查
        report = checker.run_full_check(
            days=args.days, 
            latest_run_analysis=not args.no_job_analysis
        )
        
        # 保存报告
        checker.save_report(args.output)
        
        # 输出摘要
        summary = report["summary"]
        print("\n" + "="*50)
        print("📊 CI/CD 状态检查摘要")
        print("="*50)
        print(f"总工作流数: {summary['total_workflows']}")
        print(f"健康工作流: {summary['healthy_workflows']} ✅")
        print(f"警告工作流: {summary['warning_workflows']} ⚠️")
        print(f"严重问题工作流: {summary['critical_workflows']} ❌")
        print(f"非活跃工作流: {summary['inactive_workflows']} 💤")
        
        # 显示徽章
        print("\n🏷️ 状态徽章:")
        for name, url in report["badges"].items():
            print(f"  {name}: {url}")
        
        # 检查是否有严重问题
        if summary['critical_workflows'] > 0:
            print("\n❌ 发现严重问题，请检查详细报告")
            sys.exit(1)
        elif summary['warning_workflows'] > 0:
            print("\n⚠️ 发现警告，建议检查详细报告")
            sys.exit(0)
        else:
            print("\n✅ 所有工作流运行正常")
            sys.exit(0)
            
    except Exception as e:
        print(f"❌ 检查过程中发生错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()