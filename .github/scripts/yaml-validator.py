#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YAML 文件语法验证器
用于检查 .github 目录下所有 YAML 文件的语法正确性
"""

import os
import sys
import yaml
import json
from pathlib import Path
from typing import Dict, List, Any, Tuple

class YAMLValidator:
    def __init__(self, github_dir: str):
        self.github_dir = Path(github_dir)
        self.validation_results = {
            "total_files": 0,
            "valid_files": 0,
            "invalid_files": 0,
            "errors": [],
            "warnings": [],
            "file_details": {}
        }
    
    def find_yaml_files(self) -> List[Path]:
        """查找所有 YAML 文件"""
        yaml_files = []
        for ext in ['*.yml', '*.yaml']:
            yaml_files.extend(self.github_dir.rglob(ext))
        return sorted(yaml_files)
    
    def validate_yaml_syntax(self, file_path: Path) -> Tuple[bool, str, Any]:
        """验证单个 YAML 文件的语法"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查文件是否为空
            if not content.strip():
                return False, "文件为空", None
            
            # 解析 YAML
            parsed_data = yaml.safe_load(content)
            
            # 检查解析结果
            if parsed_data is None:
                return False, "YAML 解析结果为空", None
            
            return True, "语法正确", parsed_data
            
        except yaml.YAMLError as e:
            return False, f"YAML 语法错误: {str(e)}", None
        except FileNotFoundError:
            return False, "文件不存在", None
        except Exception as e:
            return False, f"读取文件失败: {str(e)}", None
    
    def check_workflow_structure(self, data: Any, file_path: Path) -> List[str]:
        """检查工作流文件的结构"""
        warnings = []
        
        if not isinstance(data, dict):
            warnings.append("工作流文件应该是一个字典结构")
            return warnings
        
        # 检查必需的顶级键
        if 'on' not in data and 'true' not in data:
            warnings.append("缺少触发条件 'on' 或 'true'")
        
        if 'jobs' not in data:
            warnings.append("缺少 'jobs' 定义")
        
        # 检查 jobs 结构
        if 'jobs' in data and isinstance(data['jobs'], dict):
            for job_name, job_config in data['jobs'].items():
                if not isinstance(job_config, dict):
                    warnings.append(f"作业 '{job_name}' 配置应该是字典")
                    continue
                
                if 'runs-on' not in job_config:
                    warnings.append(f"作业 '{job_name}' 缺少 'runs-on' 配置")
                
                if 'steps' not in job_config:
                    warnings.append(f"作业 '{job_name}' 缺少 'steps' 配置")
                elif isinstance(job_config['steps'], list):
                    for i, step in enumerate(job_config['steps']):
                        if not isinstance(step, dict):
                            warnings.append(f"作业 '{job_name}' 的步骤 {i+1} 应该是字典")
                        elif 'name' not in step and 'uses' not in step and 'run' not in step:
                            warnings.append(f"作业 '{job_name}' 的步骤 {i+1} 缺少必要的操作")
        
        return warnings
    
    def check_duplicate_keys(self, file_path: Path) -> List[str]:
        """检查重复键（需要自定义 YAML 加载器）"""
        warnings = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 简单的重复键检查（基于行分析）
            lines = content.split('\n')
            keys_seen = set()
            current_level_keys = {}
            
            for line_num, line in enumerate(lines, 1):
                stripped = line.strip()
                if ':' in stripped and not stripped.startswith('#'):
                    # 提取键名
                    key_part = stripped.split(':')[0].strip()
                    if key_part and not key_part.startswith('-'):
                        # 计算缩进级别
                        indent_level = len(line) - len(line.lstrip())
                        
                        # 检查同级别的重复键
                        level_key = f"{indent_level}:{key_part}"
                        if level_key in current_level_keys:
                            warnings.append(f"第 {line_num} 行: 可能存在重复键 '{key_part}'")
                        else:
                            current_level_keys[level_key] = line_num
        
        except Exception as e:
            warnings.append(f"检查重复键时出错: {str(e)}")
        
        return warnings
    
    def validate_file(self, file_path: Path) -> Dict[str, Any]:
        """验证单个文件"""
        relative_path = file_path.relative_to(self.github_dir)
        
        # 验证语法
        is_valid, message, parsed_data = self.validate_yaml_syntax(file_path)
        
        result = {
            "path": str(relative_path),
            "is_valid": is_valid,
            "message": message,
            "warnings": [],
            "errors": []
        }
        
        if not is_valid:
            result["errors"].append(message)
            self.validation_results["errors"].append({
                "file": str(relative_path),
                "error": message
            })
        else:
            # 如果是工作流文件，进行额外检查
            if file_path.parent.name == 'workflows':
                workflow_warnings = self.check_workflow_structure(parsed_data, file_path)
                result["warnings"].extend(workflow_warnings)
                
                for warning in workflow_warnings:
                    self.validation_results["warnings"].append({
                        "file": str(relative_path),
                        "warning": warning
                    })
            
            # 检查重复键
            duplicate_warnings = self.check_duplicate_keys(file_path)
            result["warnings"].extend(duplicate_warnings)
            
            for warning in duplicate_warnings:
                self.validation_results["warnings"].append({
                    "file": str(relative_path),
                    "warning": warning
                })
        
        return result
    
    def validate_all(self) -> Dict[str, Any]:
        """验证所有 YAML 文件"""
        yaml_files = self.find_yaml_files()
        self.validation_results["total_files"] = len(yaml_files)
        
        print(f"找到 {len(yaml_files)} 个 YAML 文件")
        
        for file_path in yaml_files:
            print(f"验证: {file_path.relative_to(self.github_dir)}")
            
            result = self.validate_file(file_path)
            self.validation_results["file_details"][str(file_path.relative_to(self.github_dir))] = result
            
            if result["is_valid"]:
                self.validation_results["valid_files"] += 1
                status = "✅"
            else:
                self.validation_results["invalid_files"] += 1
                status = "❌"
            
            print(f"  {status} {result['message']}")
            
            if result["warnings"]:
                for warning in result["warnings"]:
                    print(f"  ⚠️  {warning}")
        
        return self.validation_results
    
    def generate_report(self) -> str:
        """生成验证报告"""
        results = self.validation_results
        
        report = []
        report.append("# YAML 文件验证报告")
        report.append("")
        report.append("## 总体统计")
        report.append(f"- 总文件数: {results['total_files']}")
        report.append(f"- 有效文件: {results['valid_files']} ✅")
        report.append(f"- 无效文件: {results['invalid_files']} ❌")
        report.append(f"- 警告数量: {len(results['warnings'])} ⚠️")
        report.append("")
        
        if results['errors']:
            report.append("## 错误详情")
            for error in results['errors']:
                report.append(f"- **{error['file']}**: {error['error']}")
            report.append("")
        
        if results['warnings']:
            report.append("## 警告详情")
            for warning in results['warnings']:
                report.append(f"- **{warning['file']}**: {warning['warning']}")
            report.append("")
        
        report.append("## 文件详情")
        for file_path, details in results['file_details'].items():
            status = "✅" if details['is_valid'] else "❌"
            report.append(f"### {status} {file_path}")
            report.append(f"- 状态: {details['message']}")
            
            if details['warnings']:
                report.append("- 警告:")
                for warning in details['warnings']:
                    report.append(f"  - {warning}")
            
            if details['errors']:
                report.append("- 错误:")
                for error in details['errors']:
                    report.append(f"  - {error}")
            
            report.append("")
        
        return "\n".join(report)
    
    def save_results(self, output_file: str = "yaml-validation-results.json"):
        """保存验证结果到 JSON 文件"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.validation_results, f, indent=2, ensure_ascii=False)
        print(f"验证结果已保存到: {output_file}")

def main():
    """主函数"""
    github_dir = ".github"
    
    if len(sys.argv) > 1:
        github_dir = sys.argv[1]
    
    if not os.path.exists(github_dir):
        print(f"错误: 目录 {github_dir} 不存在")
        sys.exit(1)
    
    print(f"开始验证 {github_dir} 目录下的 YAML 文件...")
    print("=" * 50)
    
    validator = YAMLValidator(github_dir)
    results = validator.validate_all()
    
    print("\n" + "=" * 50)
    print("验证完成!")
    print(f"总计: {results['total_files']} 个文件")
    print(f"有效: {results['valid_files']} 个 ✅")
    print(f"无效: {results['invalid_files']} 个 ❌")
    print(f"警告: {len(results['warnings'])} 个 ⚠️")
    
    # 保存结果
    validator.save_results()
    
    # 生成报告
    report = validator.generate_report()
    with open("yaml-validation-report.md", 'w', encoding='utf-8') as f:
        f.write(report)
    print("验证报告已保存到: yaml-validation-report.md")
    
    # 如果有错误，返回非零退出码
    if results['invalid_files'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()