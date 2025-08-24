#!/usr/bin/env python3
"""
CI/CD 流程验证脚本
用于验证 GitHub Actions 工作流的完整性和正确性
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime

# 简单的YAML解析器（仅支持基本结构）
def simple_yaml_load(content: str) -> Dict:
    """简单的YAML解析器，仅支持基本的键值对和列表"""
    lines = content.strip().split('\n')
    result = {}
    current_dict = result
    stack = [result]
    
    for line in lines:
        line = line.rstrip()
        if not line or line.strip().startswith('#'):
            continue
        
        # 计算缩进级别
        indent = len(line) - len(line.lstrip())
        line = line.strip()
        
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            if value:
                # 简单值
                if value.startswith('[') and value.endswith(']'):
                    # 简单列表
                    value = [item.strip().strip('"\'') for item in value[1:-1].split(',') if item.strip()]
                elif value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith('\'') and value.endswith('\''):
                    value = value[1:-1]
                elif value.lower() in ['true', 'false']:
                    value = value.lower() == 'true'
                elif value.isdigit():
                    value = int(value)
                
                current_dict[key] = value
            else:
                # 嵌套对象
                current_dict[key] = {}
        elif line.startswith('- '):
            # 列表项
            item = line[2:].strip()
            if 'items' not in current_dict:
                current_dict['items'] = []
            current_dict['items'].append(item)
    
    return result

class CICDValidator:
    def __init__(self, repo_root: str = "."):
        self.repo_root = Path(repo_root)
        self.workflows_dir = self.repo_root / ".github" / "workflows"
        self.scripts_dir = self.repo_root / ".github" / "scripts"
        self.environments_dir = self.repo_root / ".github" / "environments"
        self.validation_results = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_workflows": 0,
                "valid_workflows": 0,
                "warnings": 0,
                "errors": 0
            },
            "workflows": {},
            "ci_validation": {},
            "cd_validation": {},
            "dependencies": {},
            "environment_config": {},
            "recommendations": []
        }

    def validate_all(self) -> Dict[str, Any]:
        """执行完整的CI/CD验证"""
        print("🔍 开始CI/CD流程验证...")
        
        # 1. 验证工作流文件
        self._validate_workflow_files()
        
        # 2. 验证CI流程
        self._validate_ci_process()
        
        # 3. 验证CD流程
        self._validate_cd_process()
        
        # 4. 验证依赖关系
        self._validate_dependencies()
        
        # 5. 验证环境配置
        self._validate_environment_config()
        
        # 6. 生成建议
        self._generate_recommendations()
        
        # 7. 生成摘要
        self._generate_summary()
        
        return self.validation_results

    def _validate_workflow_files(self):
        """验证工作流文件的语法和结构"""
        print("📋 验证工作流文件...")
        
        if not self.workflows_dir.exists():
            self.validation_results["workflows"]["error"] = "工作流目录不存在"
            return
        
        workflow_files = list(self.workflows_dir.glob("*.yml")) + list(self.workflows_dir.glob("*.yaml"))
        self.validation_results["summary"]["total_workflows"] = len(workflow_files)
        
        for workflow_file in workflow_files:
            workflow_name = workflow_file.stem
            print(f"  📄 验证 {workflow_name}...")
            
            workflow_result = {
                "file": str(workflow_file),
                "valid": True,
                "errors": [],
                "warnings": [],
                "config": {}
            }
            
            try:
                with open(workflow_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    workflow_config = simple_yaml_load(content)
                
                workflow_result["config"] = workflow_config
                
                # 验证基本结构
                self._validate_workflow_structure(workflow_config, workflow_result)
                
                # 验证触发条件
                self._validate_workflow_triggers(workflow_config, workflow_result)
                
                # 验证作业配置
                self._validate_workflow_jobs(workflow_config, workflow_result)
                
                # 验证环境变量
                self._validate_workflow_env_vars(workflow_config, workflow_result)
                
            except Exception as e:
                workflow_result["valid"] = False
                if "yaml" in str(e).lower():
                    workflow_result["errors"].append(f"YAML语法错误: {str(e)}")
                else:
                    workflow_result["errors"].append(f"文件读取错误: {str(e)}")
            
            self.validation_results["workflows"][workflow_name] = workflow_result
            
            if workflow_result["valid"]:
                self.validation_results["summary"]["valid_workflows"] += 1
            
            self.validation_results["summary"]["errors"] += len(workflow_result["errors"])
            self.validation_results["summary"]["warnings"] += len(workflow_result["warnings"])

    def _validate_workflow_structure(self, config: Dict, result: Dict):
        """验证工作流基本结构"""
        required_fields = ["name", "on", "jobs"]
        
        for field in required_fields:
            if field not in config:
                result["errors"].append(f"缺少必需字段: {field}")
                result["valid"] = False
        
        # 检查作业是否为空
        if "jobs" in config and not config["jobs"]:
            result["errors"].append("作业配置为空")
            result["valid"] = False

    def _validate_workflow_triggers(self, config: Dict, result: Dict):
        """验证工作流触发条件"""
        if "on" not in config:
            return
        
        triggers = config["on"]
        
        # 检查推荐的触发条件
        recommended_triggers = ["push", "pull_request", "workflow_dispatch"]
        
        if isinstance(triggers, dict):
            trigger_types = list(triggers.keys())
        elif isinstance(triggers, list):
            trigger_types = triggers
        else:
            trigger_types = [triggers]
        
        # 检查是否有手动触发
        if "workflow_dispatch" not in trigger_types:
            result["warnings"].append("建议添加 workflow_dispatch 以支持手动触发")
        
        # 检查分支配置
        for trigger_type in ["push", "pull_request"]:
            if trigger_type in triggers and isinstance(triggers[trigger_type], dict):
                if "branches" not in triggers[trigger_type]:
                    result["warnings"].append(f"{trigger_type} 触发器未指定分支")

    def _validate_workflow_jobs(self, config: Dict, result: Dict):
        """验证作业配置"""
        if "jobs" not in config:
            return
        
        jobs = config["jobs"]
        
        for job_name, job_config in jobs.items():
            # 检查运行环境
            if "runs-on" not in job_config:
                result["errors"].append(f"作业 {job_name} 缺少 runs-on 配置")
                result["valid"] = False
            
            # 检查步骤
            if "steps" not in job_config:
                result["errors"].append(f"作业 {job_name} 缺少 steps 配置")
                result["valid"] = False
            elif not job_config["steps"]:
                result["errors"].append(f"作业 {job_name} 的 steps 为空")
                result["valid"] = False
            
            # 检查超时设置
            if "timeout-minutes" not in job_config:
                result["warnings"].append(f"作业 {job_name} 建议设置 timeout-minutes")
            
            # 检查依赖关系
            if "needs" in job_config:
                needs = job_config["needs"]
                if isinstance(needs, str):
                    needs = [needs]
                
                for dependency in needs:
                    if dependency not in jobs:
                        result["errors"].append(f"作业 {job_name} 依赖不存在的作业: {dependency}")
                        result["valid"] = False

    def _validate_workflow_env_vars(self, config: Dict, result: Dict):
        """验证环境变量配置"""
        # 检查全局环境变量
        if "env" in config:
            env_vars = config["env"]
            
            # 检查敏感信息
            for var_name, var_value in env_vars.items():
                if isinstance(var_value, str):
                    if self._contains_sensitive_data(var_value):
                        result["errors"].append(f"环境变量 {var_name} 可能包含敏感信息")
                        result["valid"] = False
        
        # 检查作业级别的环境变量
        if "jobs" in config:
            for job_name, job_config in config["jobs"].items():
                if "env" in job_config:
                    for var_name, var_value in job_config["env"].items():
                        if isinstance(var_value, str) and self._contains_sensitive_data(var_value):
                            result["errors"].append(f"作业 {job_name} 的环境变量 {var_name} 可能包含敏感信息")
                            result["valid"] = False

    def _contains_sensitive_data(self, value: str) -> bool:
        """检查字符串是否包含敏感数据"""
        sensitive_patterns = [
            r'password\s*=\s*["\'][^"\'\r\n]{8,}["\']',
            r'api[_-]?key\s*=\s*["\'][^"\'\r\n]{20,}["\']',
            r'secret[_-]?key\s*=\s*["\'][^"\'\r\n]{20,}["\']',
            r'token\s*=\s*["\'][^"\'\r\n]{20,}["\']',
            r'-----BEGIN [A-Z ]+-----'
        ]
        
        for pattern in sensitive_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        
        return False

    def _validate_ci_process(self):
        """验证CI流程配置"""
        print("🔧 验证CI流程...")
        
        ci_result = {
            "build_process": {"configured": False, "issues": []},
            "test_process": {"configured": False, "issues": []},
            "quality_checks": {"configured": False, "issues": []},
            "security_scans": {"configured": False, "issues": []},
            "artifact_management": {"configured": False, "issues": []}
        }
        
        # 检查主要CI工作流
        ci_workflows = ["ci", "test", "code-quality"]
        
        for workflow_name in ci_workflows:
            if workflow_name in self.validation_results["workflows"]:
                workflow = self.validation_results["workflows"][workflow_name]
                if workflow["valid"]:
                    self._analyze_ci_workflow(workflow["config"], ci_result)
        
        self.validation_results["ci_validation"] = ci_result

    def _analyze_ci_workflow(self, config: Dict, ci_result: Dict):
        """分析CI工作流配置"""
        if "jobs" not in config:
            return
        
        jobs = config["jobs"]
        
        # 检查构建过程
        build_jobs = [job for job_name, job in jobs.items() if "build" in job_name.lower()]
        if build_jobs:
            ci_result["build_process"]["configured"] = True
            
            for job in build_jobs:
                if "steps" in job:
                    build_steps = [step for step in job["steps"] if "build" in str(step).lower()]
                    if not build_steps:
                        ci_result["build_process"]["issues"].append("构建作业中未找到构建步骤")
        
        # 检查测试过程
        test_jobs = [job for job_name, job in jobs.items() if "test" in job_name.lower()]
        if test_jobs:
            ci_result["test_process"]["configured"] = True
            
            for job in test_jobs:
                if "steps" in job:
                    test_steps = [step for step in job["steps"] if "test" in str(step).lower()]
                    if not test_steps:
                        ci_result["test_process"]["issues"].append("测试作业中未找到测试步骤")
        
        # 检查代码质量检查
        quality_jobs = [job for job_name, job in jobs.items() if any(keyword in job_name.lower() for keyword in ["quality", "lint", "format"])]
        if quality_jobs:
            ci_result["quality_checks"]["configured"] = True
        
        # 检查安全扫描
        security_jobs = [job for job_name, job in jobs.items() if "security" in job_name.lower()]
        if security_jobs:
            ci_result["security_scans"]["configured"] = True
        
        # 检查构件管理
        for job in jobs.values():
            if "steps" in job:
                for step in job["steps"]:
                    if isinstance(step, dict) and "uses" in step:
                        if "upload-artifact" in step["uses"]:
                            ci_result["artifact_management"]["configured"] = True
                            break

    def _validate_cd_process(self):
        """验证CD流程配置"""
        print("🚀 验证CD流程...")
        
        cd_result = {
            "deployment_workflows": {"configured": False, "environments": []},
            "deployment_strategies": [],
            "rollback_capability": {"configured": False, "issues": []},
            "environment_promotion": {"configured": False, "issues": []},
            "deployment_gates": {"configured": False, "issues": []}
        }
        
        # 检查部署工作流
        deploy_workflows = ["deploy", "deployment"]
        
        for workflow_name in deploy_workflows:
            if workflow_name in self.validation_results["workflows"]:
                workflow = self.validation_results["workflows"][workflow_name]
                if workflow["valid"]:
                    self._analyze_cd_workflow(workflow["config"], cd_result)
        
        self.validation_results["cd_validation"] = cd_result

    def _analyze_cd_workflow(self, config: Dict, cd_result: Dict):
        """分析CD工作流配置"""
        cd_result["deployment_workflows"]["configured"] = True
        
        if "jobs" not in config:
            return
        
        jobs = config["jobs"]
        
        # 检查环境配置
        for job_name, job in jobs.items():
            if "environment" in job:
                env_name = job["environment"]
                if env_name not in cd_result["deployment_workflows"]["environments"]:
                    cd_result["deployment_workflows"]["environments"].append(env_name)
        
        # 检查部署策略
        if "on" in config and "workflow_dispatch" in config["on"]:
            inputs = config["on"].get("workflow_dispatch", {}).get("inputs", {})
            if "deployment_strategy" in inputs:
                cd_result["deployment_strategies"] = inputs["deployment_strategy"].get("options", [])
        
        # 检查回滚能力
        if "rollback" in str(config).lower():
            cd_result["rollback_capability"]["configured"] = True
        
        # 检查部署门控
        for job in jobs.values():
            if "needs" in job or "if" in job:
                cd_result["deployment_gates"]["configured"] = True
                break

    def _validate_dependencies(self):
        """验证工作流间的依赖关系"""
        print("🔗 验证依赖关系...")
        
        dependencies_result = {
            "workflow_dependencies": {},
            "script_references": {},
            "action_versions": {},
            "missing_dependencies": []
        }
        
        # 检查工作流依赖
        for workflow_name, workflow in self.validation_results["workflows"].items():
            if not workflow["valid"]:
                continue
            
            config = workflow["config"]
            
            # 检查workflow_run依赖
            if "on" in config and "workflow_run" in config["on"]:
                workflow_run = config["on"]["workflow_run"]
                if "workflows" in workflow_run:
                    dependencies_result["workflow_dependencies"][workflow_name] = workflow_run["workflows"]
            
            # 检查脚本引用
            script_refs = self._extract_script_references(config)
            if script_refs:
                dependencies_result["script_references"][workflow_name] = script_refs
            
            # 检查Action版本
            action_versions = self._extract_action_versions(config)
            if action_versions:
                dependencies_result["action_versions"][workflow_name] = action_versions
        
        # 检查缺失的脚本文件
        for workflow_name, scripts in dependencies_result["script_references"].items():
            for script in scripts:
                script_path = self.repo_root / script
                if not script_path.exists():
                    dependencies_result["missing_dependencies"].append({
                        "type": "script",
                        "workflow": workflow_name,
                        "path": script
                    })
        
        self.validation_results["dependencies"] = dependencies_result

    def _extract_script_references(self, config: Dict) -> List[str]:
        """提取脚本引用"""
        scripts = []
        
        def find_scripts(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key == "run" and isinstance(value, str):
                        # 查找脚本文件引用
                        script_patterns = [
                            r'python\s+([^\s]+\.py)',
                            r'node\s+([^\s]+\.js)',
                            r'bash\s+([^\s]+\.sh)',
                            r'\./([^\s]+\.(py|js|sh))'
                        ]
                        
                        for pattern in script_patterns:
                            matches = re.findall(pattern, value)
                            scripts.extend([match[0] if isinstance(match, tuple) else match for match in matches])
                    else:
                        find_scripts(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_scripts(item)
        
        find_scripts(config)
        return list(set(scripts))

    def _extract_action_versions(self, config: Dict) -> Dict[str, str]:
        """提取Action版本"""
        actions = {}
        
        def find_actions(obj):
            if isinstance(obj, dict):
                if "uses" in obj:
                    action = obj["uses"]
                    if "@" in action:
                        action_name, version = action.split("@", 1)
                        actions[action_name] = version
                for value in obj.values():
                    find_actions(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_actions(item)
        
        find_actions(config)
        return actions

    def _validate_environment_config(self):
        """验证环境配置"""
        print("🌍 验证环境配置...")
        
        env_result = {
            "environments": {},
            "secrets_usage": {},
            "environment_files": []
        }
        
        # 检查环境配置文件
        if self.environments_dir.exists():
            env_files = list(self.environments_dir.glob("*.yml")) + list(self.environments_dir.glob("*.yaml"))
            
            for env_file in env_files:
                env_name = env_file.stem
                env_result["environment_files"].append(env_name)
                
                try:
                    with open(env_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        env_config = simple_yaml_load(content)
                    
                    env_result["environments"][env_name] = {
                        "valid": True,
                        "config": env_config,
                        "issues": []
                    }
                    
                except Exception as e:
                    env_result["environments"][env_name] = {
                        "valid": False,
                        "config": {},
                        "issues": [f"配置文件读取错误: {str(e)}"]
                    }
        
        # 检查secrets使用情况
        for workflow_name, workflow in self.validation_results["workflows"].items():
            if not workflow["valid"]:
                continue
            
            secrets = self._extract_secrets_usage(workflow["config"])
            if secrets:
                env_result["secrets_usage"][workflow_name] = secrets
        
        self.validation_results["environment_config"] = env_result

    def _extract_secrets_usage(self, config: Dict) -> List[str]:
        """提取secrets使用情况"""
        secrets = []
        
        def find_secrets(obj):
            if isinstance(obj, str):
                # 查找 ${{ secrets.SECRET_NAME }} 模式
                secret_pattern = r'\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}'
                matches = re.findall(secret_pattern, obj)
                secrets.extend(matches)
            elif isinstance(obj, dict):
                for value in obj.values():
                    find_secrets(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_secrets(item)
        
        find_secrets(config)
        return list(set(secrets))

    def _generate_recommendations(self):
        """生成改进建议"""
        recommendations = []
        
        # 基于验证结果生成建议
        if self.validation_results["summary"]["errors"] > 0:
            recommendations.append({
                "type": "error",
                "priority": "high",
                "message": f"发现 {self.validation_results['summary']['errors']} 个错误，需要立即修复"
            })
        
        if self.validation_results["summary"]["warnings"] > 0:
            recommendations.append({
                "type": "warning",
                "priority": "medium",
                "message": f"发现 {self.validation_results['summary']['warnings']} 个警告，建议优化"
            })
        
        # CI流程建议
        ci_validation = self.validation_results.get("ci_validation", {})
        if not ci_validation.get("build_process", {}).get("configured"):
            recommendations.append({
                "type": "improvement",
                "priority": "high",
                "message": "建议配置自动化构建流程"
            })
        
        if not ci_validation.get("security_scans", {}).get("configured"):
            recommendations.append({
                "type": "security",
                "priority": "medium",
                "message": "建议添加安全扫描步骤"
            })
        
        # CD流程建议
        cd_validation = self.validation_results.get("cd_validation", {})
        if not cd_validation.get("rollback_capability", {}).get("configured"):
            recommendations.append({
                "type": "reliability",
                "priority": "medium",
                "message": "建议配置回滚机制"
            })
        
        # 依赖关系建议
        dependencies = self.validation_results.get("dependencies", {})
        missing_deps = dependencies.get("missing_dependencies", [])
        if missing_deps:
            recommendations.append({
                "type": "dependency",
                "priority": "high",
                "message": f"发现 {len(missing_deps)} 个缺失的依赖文件"
            })
        
        self.validation_results["recommendations"] = recommendations

    def _generate_summary(self):
        """生成验证摘要"""
        summary = self.validation_results["summary"]
        
        # 计算成功率
        if summary["total_workflows"] > 0:
            success_rate = (summary["valid_workflows"] / summary["total_workflows"]) * 100
        else:
            success_rate = 0
        
        summary["success_rate"] = round(success_rate, 2)
        
        # 总体状态
        if summary["errors"] == 0 and summary["warnings"] == 0:
            summary["status"] = "excellent"
        elif summary["errors"] == 0:
            summary["status"] = "good"
        elif summary["errors"] <= 5:
            summary["status"] = "needs_improvement"
        else:
            summary["status"] = "critical"

    def save_report(self, output_file: str = "cicd-validation-report.json"):
        """保存验证报告"""
        output_path = self.repo_root / output_file
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        
        print(f"📝 验证报告已保存到: {output_path}")
        return output_path

    def print_summary(self):
        """打印验证摘要"""
        summary = self.validation_results["summary"]
        
        print("\n" + "="*60)
        print("📊 CI/CD 验证摘要")
        print("="*60)
        print(f"总工作流数量: {summary['total_workflows']}")
        print(f"有效工作流数量: {summary['valid_workflows']}")
        print(f"成功率: {summary['success_rate']}%")
        print(f"错误数量: {summary['errors']}")
        print(f"警告数量: {summary['warnings']}")
        print(f"总体状态: {summary['status']}")
        
        # 打印建议
        recommendations = self.validation_results.get("recommendations", [])
        if recommendations:
            print("\n🔍 改进建议:")
            for i, rec in enumerate(recommendations[:5], 1):
                print(f"  {i}. [{rec['priority'].upper()}] {rec['message']}")
        
        print("="*60)

def main():
    """主函数"""
    validator = CICDValidator()
    
    try:
        # 执行验证
        results = validator.validate_all()
        
        # 保存报告
        report_path = validator.save_report()
        
        # 打印摘要
        validator.print_summary()
        
        # 根据验证结果设置退出码
        if results["summary"]["errors"] > 0:
            print("\n❌ 验证失败：发现严重错误")
            sys.exit(1)
        elif results["summary"]["warnings"] > 0:
            print("\n⚠️ 验证通过：但有警告需要关注")
            sys.exit(0)
        else:
            print("\n✅ 验证完全通过")
            sys.exit(0)
    
    except Exception as e:
        print(f"❌ 验证过程中发生错误: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()