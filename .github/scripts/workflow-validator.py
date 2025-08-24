#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Actions 工作流验证器
用于验证工作流配置和触发条件
"""

import os
import sys
import yaml
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import argparse
from datetime import datetime


class WorkflowValidator:
    """工作流验证器"""
    
    def __init__(self, workflows_dir: str = ".github/workflows"):
        self.workflows_dir = Path(workflows_dir)
        self.validation_results = {
            "timestamp": datetime.now().isoformat(),
            "workflows": {},
            "summary": {
                "total_workflows": 0,
                "valid_workflows": 0,
                "invalid_workflows": 0,
                "warnings": 0
            },
            "global_issues": [],
            "recommendations": []
        }
    
    def load_workflow_file(self, file_path: Path) -> Tuple[Optional[Dict], List[str]]:
        """加载工作流文件"""
        errors = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查文件是否为空
            if not content.strip():
                errors.append("工作流文件为空")
                return None, errors
            
            # 尝试解析YAML
            try:
                workflow = yaml.safe_load(content)
                if not workflow:
                    errors.append("YAML解析结果为空")
                    return None, errors
                
                return workflow, errors
                
            except yaml.YAMLError as e:
                errors.append(f"YAML语法错误: {str(e)}")
                return None, errors
                
        except FileNotFoundError:
            errors.append("文件不存在")
            return None, errors
        except Exception as e:
            errors.append(f"读取文件失败: {str(e)}")
            return None, errors
    
    def validate_workflow_structure(self, workflow: Dict, filename: str) -> List[Dict[str, Any]]:
        """验证工作流基本结构"""
        issues = []
        
        # 检查必需字段
        required_fields = ['name', 'on', 'jobs']
        for field in required_fields:
            if field not in workflow:
                issues.append({
                    "type": "error",
                    "category": "structure",
                    "message": f"缺少必需字段: {field}",
                    "line": None
                })
        
        # 检查工作流名称
        if 'name' in workflow:
            name = workflow['name']
            if not isinstance(name, str) or not name.strip():
                issues.append({
                    "type": "error",
                    "category": "structure",
                    "message": "工作流名称不能为空",
                    "line": None
                })
            elif len(name) > 100:
                issues.append({
                    "type": "warning",
                    "category": "structure",
                    "message": "工作流名称过长 (>100字符)",
                    "line": None
                })
        
        # 检查作业定义
        if 'jobs' in workflow:
            jobs = workflow['jobs']
            if not isinstance(jobs, dict) or not jobs:
                issues.append({
                    "type": "error",
                    "category": "structure",
                    "message": "jobs字段必须是非空字典",
                    "line": None
                })
            else:
                # 检查每个作业
                for job_name, job_config in jobs.items():
                    if not isinstance(job_config, dict):
                        issues.append({
                            "type": "error",
                            "category": "structure",
                            "message": f"作业 '{job_name}' 配置必须是字典",
                            "line": None
                        })
                        continue
                    
                    # 检查作业必需字段
                    if 'runs-on' not in job_config:
                        issues.append({
                            "type": "error",
                            "category": "structure",
                            "message": f"作业 '{job_name}' 缺少 runs-on 字段",
                            "line": None
                        })
                    
                    # 检查步骤定义
                    if 'steps' in job_config:
                        steps = job_config['steps']
                        if not isinstance(steps, list):
                            issues.append({
                                "type": "error",
                                "category": "structure",
                                "message": f"作业 '{job_name}' 的 steps 必须是列表",
                                "line": None
                            })
                        elif not steps:
                            issues.append({
                                "type": "warning",
                                "category": "structure",
                                "message": f"作业 '{job_name}' 没有定义步骤",
                                "line": None
                            })
        
        return issues
    
    def validate_triggers(self, workflow: Dict, filename: str) -> List[Dict[str, Any]]:
        """验证触发条件"""
        issues = []
        
        if 'on' not in workflow:
            return issues
        
        triggers = workflow['on']
        
        # 如果是字符串，转换为字典
        if isinstance(triggers, str):
            triggers = {triggers: {}}
        elif isinstance(triggers, list):
            triggers = {trigger: {} for trigger in triggers}
        
        if not isinstance(triggers, dict):
            issues.append({
                "type": "error",
                "category": "triggers",
                "message": "触发条件格式不正确",
                "line": None
            })
            return issues
        
        # 检查常见触发事件
        valid_events = [
            'push', 'pull_request', 'pull_request_target', 'schedule',
            'workflow_dispatch', 'repository_dispatch', 'release',
            'create', 'delete', 'fork', 'gollum', 'issue_comment',
            'issues', 'label', 'milestone', 'page_build', 'project',
            'project_card', 'project_column', 'public', 'pull_request_review',
            'pull_request_review_comment', 'registry_package', 'status',
            'watch', 'workflow_call', 'workflow_run'
        ]
        
        for event, config in triggers.items():
            if event not in valid_events:
                issues.append({
                    "type": "warning",
                    "category": "triggers",
                    "message": f"未知的触发事件: {event}",
                    "line": None
                })
            
            # 检查push和pull_request的分支配置
            if event in ['push', 'pull_request'] and isinstance(config, dict):
                if 'branches' in config:
                    branches = config['branches']
                    if isinstance(branches, list):
                        for branch in branches:
                            if not isinstance(branch, str):
                                issues.append({
                                    "type": "error",
                                    "category": "triggers",
                                    "message": f"分支名称必须是字符串: {branch}",
                                    "line": None
                                })
                
                # 检查路径过滤
                if 'paths' in config:
                    paths = config['paths']
                    if isinstance(paths, list):
                        for path in paths:
                            if not isinstance(path, str):
                                issues.append({
                                    "type": "error",
                                    "category": "triggers",
                                    "message": f"路径必须是字符串: {path}",
                                    "line": None
                                })
            
            # 检查schedule配置
            if event == 'schedule':
                if not isinstance(config, list):
                    issues.append({
                        "type": "error",
                        "category": "triggers",
                        "message": "schedule触发器必须是列表",
                        "line": None
                    })
                else:
                    for schedule_item in config:
                        if not isinstance(schedule_item, dict) or 'cron' not in schedule_item:
                            issues.append({
                                "type": "error",
                                "category": "triggers",
                                "message": "schedule项目必须包含cron字段",
                                "line": None
                            })
                        else:
                            # 简单的cron表达式验证
                            cron = schedule_item['cron']
                            if not self._validate_cron(cron):
                                issues.append({
                                    "type": "error",
                                    "category": "triggers",
                                    "message": f"无效的cron表达式: {cron}",
                                    "line": None
                                })
        
        # 检查是否有合理的触发条件
        if not triggers:
            issues.append({
                "type": "warning",
                "category": "triggers",
                "message": "没有定义触发条件",
                "line": None
            })
        
        return issues
    
    def _validate_cron(self, cron: str) -> bool:
        """验证cron表达式"""
        if not isinstance(cron, str):
            return False
        
        parts = cron.strip().split()
        if len(parts) != 5:
            return False
        
        # 简单验证每个部分
        for part in parts:
            if not re.match(r'^[0-9*,/-]+$', part):
                return False
        
        return True
    
    def validate_actions_versions(self, workflow: Dict, filename: str) -> List[Dict[str, Any]]:
        """验证Actions版本"""
        issues = []
        
        # 已知的过时Actions
        deprecated_actions = {
            'actions/checkout@v1': 'actions/checkout@v4',
            'actions/checkout@v2': 'actions/checkout@v4',
            'actions/checkout@v3': 'actions/checkout@v4',
            'actions/setup-node@v1': 'actions/setup-node@v4',
            'actions/setup-node@v2': 'actions/setup-node@v4',
            'actions/setup-node@v3': 'actions/setup-node@v4',
            'actions/setup-python@v1': 'actions/setup-python@v5',
            'actions/setup-python@v2': 'actions/setup-python@v5',
            'actions/setup-python@v3': 'actions/setup-python@v5',
            'actions/setup-python@v4': 'actions/setup-python@v5',
            'actions/upload-artifact@v1': 'actions/upload-artifact@v4',
            'actions/upload-artifact@v2': 'actions/upload-artifact@v4',
            'actions/upload-artifact@v3': 'actions/upload-artifact@v4',
            'actions/download-artifact@v1': 'actions/download-artifact@v4',
            'actions/download-artifact@v2': 'actions/download-artifact@v4',
            'actions/download-artifact@v3': 'actions/download-artifact@v4'
        }
        
        def check_steps(steps, job_name=""):
            if not isinstance(steps, list):
                return
            
            for i, step in enumerate(steps):
                if not isinstance(step, dict):
                    continue
                
                if 'uses' in step:
                    action = step['uses']
                    if action in deprecated_actions:
                        issues.append({
                            "type": "warning",
                            "category": "actions",
                            "message": f"使用了过时的Action: {action}，建议升级到 {deprecated_actions[action]}",
                            "line": None,
                            "job": job_name,
                            "step": i + 1
                        })
                    
                    # 检查是否使用了SHA而不是标签
                    if '@' in action and len(action.split('@')[1]) == 40:
                        issues.append({
                            "type": "info",
                            "category": "actions",
                            "message": f"使用了SHA版本的Action: {action}，考虑使用标签版本以提高可读性",
                            "line": None,
                            "job": job_name,
                            "step": i + 1
                        })
                    
                    # 检查是否使用了不安全的Action
                    if not action.startswith(('actions/', 'github/')):
                        # 第三方Action，建议固定版本
                        if '@' not in action or action.endswith('@main') or action.endswith('@master'):
                            issues.append({
                                "type": "warning",
                                "category": "security",
                                "message": f"第三方Action未固定版本: {action}，建议固定到特定版本",
                                "line": None,
                                "job": job_name,
                                "step": i + 1
                            })
        
        if 'jobs' in workflow:
            for job_name, job_config in workflow['jobs'].items():
                if isinstance(job_config, dict) and 'steps' in job_config:
                    check_steps(job_config['steps'], job_name)
        
        return issues
    
    def validate_security(self, workflow: Dict, filename: str) -> List[Dict[str, Any]]:
        """验证安全配置"""
        issues = []
        
        # 检查权限配置
        if 'permissions' in workflow:
            permissions = workflow['permissions']
            if isinstance(permissions, dict):
                # 检查是否有过度权限
                dangerous_permissions = ['write-all', 'admin']
                for perm, value in permissions.items():
                    if value in dangerous_permissions:
                        issues.append({
                            "type": "warning",
                            "category": "security",
                            "message": f"检测到高权限配置: {perm}: {value}",
                            "line": None
                        })
        
        # 检查环境变量中的敏感信息
        def check_env_vars(env_vars, context=""):
            if not isinstance(env_vars, dict):
                return
            
            sensitive_patterns = [
                r'password', r'secret', r'key', r'token', r'credential'
            ]
            
            for var_name, var_value in env_vars.items():
                if isinstance(var_value, str):
                    # 检查是否直接暴露敏感信息
                    for pattern in sensitive_patterns:
                        if re.search(pattern, var_name.lower()) and not var_value.startswith('${{'):
                            issues.append({
                                "type": "error",
                                "category": "security",
                                "message": f"可能暴露敏感信息的环境变量: {var_name} {context}",
                                "line": None
                            })
        
        # 检查全局环境变量
        if 'env' in workflow:
            check_env_vars(workflow['env'], "(全局)")
        
        # 检查作业级别的环境变量
        if 'jobs' in workflow:
            for job_name, job_config in workflow['jobs'].items():
                if isinstance(job_config, dict):
                    if 'env' in job_config:
                        check_env_vars(job_config['env'], f"(作业: {job_name})")
                    
                    # 检查步骤级别的环境变量
                    if 'steps' in job_config and isinstance(job_config['steps'], list):
                        for i, step in enumerate(job_config['steps']):
                            if isinstance(step, dict) and 'env' in step:
                                check_env_vars(step['env'], f"(作业: {job_name}, 步骤: {i+1})")
        
        return issues
    
    def validate_performance(self, workflow: Dict, filename: str) -> List[Dict[str, Any]]:
        """验证性能配置"""
        issues = []
        
        if 'jobs' not in workflow:
            return issues
        
        for job_name, job_config in workflow['jobs'].items():
            if not isinstance(job_config, dict):
                continue
            
            # 检查超时配置
            if 'timeout-minutes' in job_config:
                timeout = job_config['timeout-minutes']
                if isinstance(timeout, int):
                    if timeout > 360:  # 6小时
                        issues.append({
                            "type": "warning",
                            "category": "performance",
                            "message": f"作业 '{job_name}' 超时时间过长: {timeout}分钟",
                            "line": None
                        })
                    elif timeout < 5:
                        issues.append({
                            "type": "warning",
                            "category": "performance",
                            "message": f"作业 '{job_name}' 超时时间过短: {timeout}分钟",
                            "line": None
                        })
            
            # 检查并发配置
            if 'strategy' in job_config:
                strategy = job_config['strategy']
                if isinstance(strategy, dict) and 'matrix' in strategy:
                    matrix = strategy['matrix']
                    if isinstance(matrix, dict):
                        # 计算矩阵大小
                        matrix_size = 1
                        for key, values in matrix.items():
                            if isinstance(values, list):
                                matrix_size *= len(values)
                        
                        if matrix_size > 20:
                            issues.append({
                                "type": "warning",
                                "category": "performance",
                                "message": f"作业 '{job_name}' 矩阵过大: {matrix_size} 个组合",
                                "line": None
                            })
            
            # 检查步骤数量
            if 'steps' in job_config and isinstance(job_config['steps'], list):
                step_count = len(job_config['steps'])
                if step_count > 50:
                    issues.append({
                        "type": "warning",
                        "category": "performance",
                        "message": f"作业 '{job_name}' 步骤过多: {step_count} 个步骤",
                        "line": None
                    })
        
        return issues
    
    def validate_workflow_file(self, file_path: Path) -> Dict[str, Any]:
        """验证单个工作流文件"""
        filename = file_path.name
        result = {
            "filename": filename,
            "path": str(file_path),
            "valid": True,
            "issues": [],
            "categories": {
                "structure": 0,
                "triggers": 0,
                "actions": 0,
                "security": 0,
                "performance": 0
            },
            "severity": {
                "error": 0,
                "warning": 0,
                "info": 0
            }
        }
        
        # 加载工作流文件
        workflow, load_errors = self.load_workflow_file(file_path)
        
        if load_errors:
            for error in load_errors:
                result["issues"].append({
                    "type": "error",
                    "category": "structure",
                    "message": error,
                    "line": None
                })
            result["valid"] = False
        
        if workflow:
            # 运行各种验证
            validators = [
                self.validate_workflow_structure,
                self.validate_triggers,
                self.validate_actions_versions,
                self.validate_security,
                self.validate_performance
            ]
            
            for validator in validators:
                issues = validator(workflow, filename)
                result["issues"].extend(issues)
        
        # 统计问题
        for issue in result["issues"]:
            category = issue.get("category", "other")
            severity = issue.get("type", "info")
            
            if category in result["categories"]:
                result["categories"][category] += 1
            
            if severity in result["severity"]:
                result["severity"][severity] += 1
            
            # 如果有错误，标记为无效
            if severity == "error":
                result["valid"] = False
        
        return result
    
    def validate_all_workflows(self) -> Dict[str, Any]:
        """验证所有工作流文件"""
        print(f"🔍 扫描工作流目录: {self.workflows_dir}")
        
        if not self.workflows_dir.exists():
            self.validation_results["global_issues"].append(
                f"工作流目录不存在: {self.workflows_dir}"
            )
            return self.validation_results
        
        # 查找所有YAML文件
        workflow_files = list(self.workflows_dir.glob("*.yml")) + list(self.workflows_dir.glob("*.yaml"))
        
        if not workflow_files:
            self.validation_results["global_issues"].append(
                "没有找到工作流文件"
            )
            return self.validation_results
        
        print(f"📋 找到 {len(workflow_files)} 个工作流文件")
        
        # 验证每个文件
        for file_path in workflow_files:
            print(f"  🔧 验证: {file_path.name}")
            result = self.validate_workflow_file(file_path)
            self.validation_results["workflows"][file_path.name] = result
        
        # 计算摘要
        summary = self.validation_results["summary"]
        summary["total_workflows"] = len(workflow_files)
        
        for workflow_result in self.validation_results["workflows"].values():
            if workflow_result["valid"]:
                summary["valid_workflows"] += 1
            else:
                summary["invalid_workflows"] += 1
            
            summary["warnings"] += workflow_result["severity"]["warning"]
        
        # 生成建议
        self._generate_recommendations()
        
        return self.validation_results
    
    def _generate_recommendations(self):
        """生成改进建议"""
        recommendations = []
        
        # 分析所有问题
        all_issues = []
        for workflow_result in self.validation_results["workflows"].values():
            all_issues.extend(workflow_result["issues"])
        
        # 统计问题类型
        issue_counts = {}
        for issue in all_issues:
            key = f"{issue['category']}:{issue['type']}"
            issue_counts[key] = issue_counts.get(key, 0) + 1
        
        # 生成针对性建议
        if issue_counts.get("actions:warning", 0) > 0:
            recommendations.append("建议升级过时的GitHub Actions到最新版本")
        
        if issue_counts.get("security:warning", 0) > 0:
            recommendations.append("检查并修复安全配置问题")
        
        if issue_counts.get("performance:warning", 0) > 0:
            recommendations.append("优化工作流性能配置")
        
        if issue_counts.get("structure:error", 0) > 0:
            recommendations.append("修复工作流结构错误")
        
        # 通用建议
        if self.validation_results["summary"]["invalid_workflows"] > 0:
            recommendations.append("修复无效的工作流文件")
        
        if not recommendations:
            recommendations.append("所有工作流配置良好，无需改进")
        
        self.validation_results["recommendations"] = recommendations
    
    def generate_report(self) -> str:
        """生成验证报告"""
        report = []
        report.append("# 🔧 GitHub Actions 工作流验证报告\n")
        report.append(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # 摘要
        summary = self.validation_results["summary"]
        report.append("## 📊 验证摘要\n")
        report.append(f"- 总工作流数: {summary['total_workflows']}")
        report.append(f"- ✅ 有效工作流: {summary['valid_workflows']}")
        report.append(f"- ❌ 无效工作流: {summary['invalid_workflows']}")
        report.append(f"- ⚠️ 警告数量: {summary['warnings']}\n")
        
        # 全局问题
        if self.validation_results["global_issues"]:
            report.append("## 🚨 全局问题\n")
            for issue in self.validation_results["global_issues"]:
                report.append(f"- {issue}")
            report.append("\n")
        
        # 工作流详情
        if self.validation_results["workflows"]:
            report.append("## 📋 工作流详情\n")
            report.append("| 文件名 | 状态 | 错误 | 警告 | 信息 | 主要问题 |")
            report.append("|--------|------|------|------|------|----------|")
            
            for filename, result in self.validation_results["workflows"].items():
                status = "✅" if result["valid"] else "❌"
                errors = result["severity"]["error"]
                warnings = result["severity"]["warning"]
                infos = result["severity"]["info"]
                
                # 获取主要问题
                main_issues = []
                for issue in result["issues"][:3]:  # 只显示前3个问题
                    main_issues.append(issue["message"][:50] + "..." if len(issue["message"]) > 50 else issue["message"])
                
                main_issues_text = "; ".join(main_issues) if main_issues else "无"
                
                report.append(
                    f"| {filename} | {status} | {errors} | {warnings} | {infos} | {main_issues_text} |"
                )
            
            report.append("\n")
        
        # 建议
        if self.validation_results["recommendations"]:
            report.append("## 💡 改进建议\n")
            for i, rec in enumerate(self.validation_results["recommendations"], 1):
                report.append(f"{i}. {rec}")
            report.append("\n")
        
        return "\n".join(report)
    
    def save_report(self, output_dir: str = "validation-reports") -> None:
        """保存验证报告"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # 保存JSON报告
        json_file = output_path / "workflow-validation.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        
        # 保存Markdown报告
        md_file = output_path / "workflow-validation.md"
        report_content = self.generate_report()
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(report_content)
        
        print(f"\n📁 验证报告已保存到 {output_dir}/")
        print(f"  - JSON报告: {json_file}")
        print(f"  - Markdown报告: {md_file}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="GitHub Actions 工作流验证器")
    parser.add_argument("--workflows-dir", default=".github/workflows", help="工作流目录路径")
    parser.add_argument("--output", default="validation-reports", help="输出目录")
    parser.add_argument("--quiet", action="store_true", help="静默模式")
    
    args = parser.parse_args()
    
    # 创建验证器
    validator = WorkflowValidator(args.workflows_dir)
    
    try:
        # 运行验证
        if not args.quiet:
            print("🚀 开始工作流验证...\n")
        
        results = validator.validate_all_workflows()
        
        # 保存报告
        validator.save_report(args.output)
        
        # 输出摘要
        summary = results["summary"]
        if not args.quiet:
            print("\n" + "="*50)
            print("📊 工作流验证摘要")
            print("="*50)
            print(f"总工作流数: {summary['total_workflows']}")
            print(f"有效工作流: {summary['valid_workflows']} ✅")
            print(f"无效工作流: {summary['invalid_workflows']} ❌")
            print(f"警告数量: {summary['warnings']} ⚠️")
        
        # 检查验证结果
        if summary['invalid_workflows'] > 0:
            if not args.quiet:
                print("\n❌ 发现无效的工作流文件")
            sys.exit(1)
        elif summary['warnings'] > 5:
            if not args.quiet:
                print("\n⚠️ 发现较多警告，建议检查")
            sys.exit(0)
        else:
            if not args.quiet:
                print("\n✅ 所有工作流验证通过")
            sys.exit(0)
            
    except Exception as e:
        print(f"❌ 验证过程中发生错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()