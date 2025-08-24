#!/usr/bin/env python3
"""
CI/CD工作流验证器
用于验证GitHub Actions工作流的配置和依赖关系
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime

class CICDValidator:
    def __init__(self, workflows_dir=".github/workflows"):
        self.workflows_dir = Path(workflows_dir)
        self.workflows = {}
        self.validation_results = {
            "summary": {
                "total_workflows": 0,
                "valid_workflows": 0,
                "success_rate": 0.0,
                "errors": 0,
                "warnings": 0,
                "status": "unknown"
            },
            "workflows": {},
            "recommendations": [],
            "timestamp": datetime.now().isoformat()
        }
    
    def analyze_workflow_content(self, content):
        """分析工作流内容，提取关键信息"""
        result = {
            'name': None,
            'has_on': False,
            'has_jobs': False,
            'has_workflow_dispatch': False,
            'jobs': [],
            'triggers': [],
            'errors': [],
            'warnings': []
        }
        
        lines = content.split('\n')
        
        # 提取工作流名称
        for line in lines:
            if line.strip().startswith('name:'):
                result['name'] = line.split(':', 1)[1].strip().strip('"\'')
                break
        
        # 检查触发条件
        if 'on:' in content:
            result['has_on'] = True
            
        # 检查常见触发器
        if 'push:' in content:
            result['triggers'].append('push')
        if 'pull_request:' in content:
            result['triggers'].append('pull_request')
        if 'schedule:' in content:
            result['triggers'].append('schedule')
        if 'workflow_dispatch:' in content:
            result['has_workflow_dispatch'] = True
            result['triggers'].append('workflow_dispatch')
        if 'workflow_run:' in content:
            result['triggers'].append('workflow_run')
        
        # 检查作业定义
        if 'jobs:' in content:
            result['has_jobs'] = True
            
            # 提取作业名称（改进的方法）
            in_jobs_section = False
            current_indent = 0
            
            for line in lines:
                stripped = line.strip()
                
                # 检测jobs section的开始
                if stripped == 'jobs:':
                    in_jobs_section = True
                    current_indent = len(line) - len(line.lstrip())
                    continue
                
                if in_jobs_section:
                    line_indent = len(line) - len(line.lstrip())
                    
                    # 如果遇到同级或更高级的section，退出jobs section
                    if line.strip() and line_indent <= current_indent and ':' in stripped and not stripped.startswith('#'):
                        break
                    
                    # 检查作业定义（jobs下的直接子项）
                    if (line_indent == current_indent + 2 and ':' in stripped and 
                        not stripped.startswith('#') and not stripped.startswith('-')):
                        
                        job_name = stripped.split(':')[0].strip()
                        
                        # 过滤掉非作业的键
                        excluded_keys = {
                            'runs-on', 'needs', 'if', 'steps', 'strategy', 'env', 
                            'timeout-minutes', 'permissions', 'outputs', 'defaults',
                            'continue-on-error', 'container', 'services', 'uses',
                            'with', 'secrets', 'name', 'run', 'shell', 'working-directory'
                        }
                        
                        # 只添加看起来像作业名称的键（通常是字母、数字、连字符、下划线）
                        if (job_name and 
                            job_name not in excluded_keys and
                            re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', job_name) and
                            len(job_name) > 1):
                            result['jobs'].append(job_name)
        
        return result
    
    def load_workflows(self):
        """加载所有工作流文件"""
        if not self.workflows_dir.exists():
            print(f"工作流目录不存在: {self.workflows_dir}")
            return
        
        for workflow_file in self.workflows_dir.glob("*.yml"):
            try:
                with open(workflow_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                analysis = self.analyze_workflow_content(content)
                self.workflows[workflow_file.stem] = {
                    'file': str(workflow_file),
                    'content': content,
                    'analysis': analysis
                }
                
            except Exception as e:
                print(f"加载工作流文件失败 {workflow_file}: {e}")
                self.workflows[workflow_file.stem] = {
                    'file': str(workflow_file),
                    'content': '',
                    'analysis': {'errors': [f'文件加载失败: {str(e)}']}
                }
    
    def validate_workflow(self, name, workflow):
        """验证单个工作流"""
        errors = []
        warnings = []
        
        analysis = workflow['analysis']
        
        # 检查基本结构
        if 'errors' in analysis and analysis['errors']:
            errors.extend(analysis['errors'])
            return False, errors, warnings
        
        if not analysis.get('name'):
            warnings.append("缺少工作流名称")
        
        if not analysis.get('has_on'):
            errors.append("缺少触发条件 (on)")
        
        if not analysis.get('has_jobs'):
            errors.append("没有定义作业 (jobs)")
        elif not analysis.get('jobs'):
            warnings.append("作业部分为空或无法解析")
        
        # 检查触发条件
        if not analysis.get('triggers'):
            warnings.append("没有检测到有效的触发条件")
        
        # 检查是否支持手动触发
        if not analysis.get('has_workflow_dispatch'):
            warnings.append("建议添加 workflow_dispatch 以支持手动触发")
        
        # 检查特定工作流的要求
        if name == 'ci':
            if 'test' not in str(workflow['content']).lower():
                warnings.append("CI工作流建议包含测试步骤")
            if 'build' not in str(workflow['content']).lower():
                warnings.append("CI工作流建议包含构建步骤")
        
        elif name == 'deploy':
            if 'environment' not in str(workflow['content']).lower():
                warnings.append("部署工作流建议指定环境")
            if 'production' not in str(workflow['content']).lower():
                warnings.append("部署工作流建议包含生产环境配置")
        
        elif name == 'test':
            if 'coverage' not in str(workflow['content']).lower():
                warnings.append("测试工作流建议包含覆盖率检查")
        
        is_valid = len(errors) == 0
        return is_valid, errors, warnings
    
    def validate_ci_process(self):
        """验证CI流程"""
        ci_workflows = ['ci', 'test', 'code-quality']
        found_workflows = []
        
        for workflow_name in ci_workflows:
            if workflow_name in self.workflows:
                found_workflows.append(workflow_name)
        
        if not found_workflows:
            self.validation_results['recommendations'].append(
                "建议添加CI工作流 (ci.yml, test.yml, code-quality.yml)"
            )
        
        return found_workflows
    
    def validate_cd_process(self):
        """验证CD流程"""
        cd_workflows = ['deploy', 'docker-build']
        found_workflows = []
        
        for workflow_name in cd_workflows:
            if workflow_name in self.workflows:
                found_workflows.append(workflow_name)
        
        if not found_workflows:
            self.validation_results['recommendations'].append(
                "建议添加CD工作流 (deploy.yml, docker-build.yml)"
            )
        
        return found_workflows
    
    def check_workflow_dependencies(self):
        """检查工作流间的依赖关系"""
        issues = []
        
        # 检查CI -> CD 依赖
        if 'deploy' in self.workflows:
            deploy_content = self.workflows['deploy']['content']
            if 'workflow_run' in deploy_content and 'CI/CD' in deploy_content:
                # 部署工作流依赖CI工作流
                if 'ci' not in self.workflows:
                    issues.append("部署工作流依赖CI工作流，但CI工作流不存在")
        
        return issues
    
    def run_validation(self):
        """运行完整验证"""
        print("开始验证CI/CD工作流...")
        
        # 加载工作流
        self.load_workflows()
        
        total_workflows = len(self.workflows)
        valid_workflows = 0
        total_errors = 0
        total_warnings = 0
        
        # 验证每个工作流
        for name, workflow in self.workflows.items():
            is_valid, errors, warnings = self.validate_workflow(name, workflow)
            
            self.validation_results['workflows'][name] = {
                'file': workflow['file'],
                'valid': is_valid,
                'errors': errors,
                'warnings': warnings,
                'analysis': workflow['analysis'],
                'name': workflow['analysis'].get('name', 'Unknown'),
                'triggers': workflow['analysis'].get('triggers', []),
                'jobs': workflow['analysis'].get('jobs', [])
            }
            
            if is_valid:
                valid_workflows += 1
            
            total_errors += len(errors)
            total_warnings += len(warnings)
        
        # 验证CI/CD流程
        ci_workflows = self.validate_ci_process()
        cd_workflows = self.validate_cd_process()
        
        # 检查依赖关系
        dependency_issues = self.check_workflow_dependencies()
        if dependency_issues:
            self.validation_results['recommendations'].extend(dependency_issues)
        
        # 更新汇总信息
        self.validation_results['summary'].update({
            'total_workflows': total_workflows,
            'valid_workflows': valid_workflows,
            'success_rate': (valid_workflows / total_workflows * 100) if total_workflows > 0 else 0,
            'errors': total_errors,
            'warnings': total_warnings,
            'ci_workflows': ci_workflows,
            'cd_workflows': cd_workflows
        })
        
        # 确定整体状态
        if total_errors == 0 and total_warnings <= 10:
            status = 'excellent'
        elif total_errors == 0 and total_warnings <= 20:
            status = 'good'
        elif total_errors <= 3:
            status = 'warning'
        else:
            status = 'critical'
        
        self.validation_results['summary']['status'] = status
        
        # 添加改进建议
        if total_errors > 0:
            self.validation_results['recommendations'].append(
                f"修复 {total_errors} 个错误以提高工作流稳定性"
            )
        
        if total_warnings > 10:
            self.validation_results['recommendations'].append(
                f"优化 {total_warnings} 个警告以提升工作流质量"
            )
        
        # 检查关键工作流
        if 'ci' in self.workflows and self.validation_results['workflows']['ci']['valid']:
            self.validation_results['recommendations'].append("✅ CI工作流配置正确")
        
        if 'deploy' in self.workflows and self.validation_results['workflows']['deploy']['valid']:
            self.validation_results['recommendations'].append("✅ 部署工作流配置正确")
        
        if 'test' in self.workflows and self.validation_results['workflows']['test']['valid']:
            self.validation_results['recommendations'].append("✅ 测试工作流配置正确")
        
        # 通用建议
        general_recommendations = [
            "建议定期更新GitHub Actions版本",
            "建议添加工作流运行时间监控",
            "建议配置失败通知机制"
        ]
        
        self.validation_results['recommendations'].extend(general_recommendations)
        
        return self.validation_results
    
    def save_report(self, filename="cicd-validation-report.json"):
        """保存验证报告"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        
        print(f"验证报告已保存到: {filename}")
    
    def print_summary(self):
        """打印验证摘要"""
        summary = self.validation_results['summary']
        
        print("\n=== CI/CD 工作流验证报告 ===")
        print(f"总工作流数: {summary['total_workflows']}")
        print(f"有效工作流: {summary['valid_workflows']}")
        print(f"成功率: {summary['success_rate']:.1f}%")
        print(f"错误数: {summary['errors']}")
        print(f"警告数: {summary['warnings']}")
        print(f"整体状态: {summary['status']}")
        
        if 'ci_workflows' in summary:
            print(f"CI工作流: {', '.join(summary['ci_workflows']) if summary['ci_workflows'] else '无'}")
        
        if 'cd_workflows' in summary:
            print(f"CD工作流: {', '.join(summary['cd_workflows']) if summary['cd_workflows'] else '无'}")
        
        print("\n工作流详情:")
        for name, workflow in self.validation_results['workflows'].items():
            status = "✅" if workflow['valid'] else "❌"
            print(f"{status} {name}: {workflow['name']} ({len(workflow['jobs'])} 个作业)")
            if workflow['errors']:
                for error in workflow['errors'][:2]:  # 只显示前2个错误
                    print(f"   错误: {error}")
        
        print("\n主要建议:")
        for i, rec in enumerate(self.validation_results['recommendations'][:5], 1):
            print(f"{i}. {rec}")

def main():
    validator = CICDValidator()
    results = validator.run_validation()
    validator.print_summary()
    validator.save_report()
    
    return results

if __name__ == "__main__":
    main()