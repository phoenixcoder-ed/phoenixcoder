#!/usr/bin/env python3
"""测试覆盖率分析工具"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Any


class CoverageAnalyzer:
    """测试覆盖率分析器"""
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.coverage_dir = self.project_root / "htmlcov"
        self.coverage_json = self.project_root / "coverage.json"
    
    def run_coverage_tests(self) -> bool:
        """运行带覆盖率的测试"""
        print("🧪 运行测试并生成覆盖率报告...")
        
        # 先运行一个简单的测试来生成覆盖率数据
        cmd = [
            "python", "-m", "pytest",
            "tests/test_basic_api.py",
            "--cov=api",
            "--cov=services", 
            "--cov=repositories",
            "--cov-report=html:htmlcov",
            "--cov-report=json:coverage.json",
            "--cov-report=term-missing",
            "-v"
        ]
        
        try:
            result = subprocess.run(cmd, cwd=self.project_root, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ 测试运行成功")
                print(result.stdout)
                return True
            else:
                print(f"❌ 测试运行失败:")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ 运行测试时出错: {e}")
            return False
    
    def analyze_coverage_data(self) -> Dict[str, Any]:
        """分析覆盖率数据"""
        if not self.coverage_json.exists():
            print("❌ 覆盖率JSON文件不存在，请先运行测试")
            return {}
        
        try:
            with open(self.coverage_json, 'r', encoding='utf-8') as f:
                coverage_data = json.load(f)
            
            return self._process_coverage_data(coverage_data)
        except Exception as e:
            print(f"❌ 分析覆盖率数据时出错: {e}")
            return {}
    
    def _process_coverage_data(self, data: Dict) -> Dict[str, Any]:
        """处理覆盖率数据"""
        files = data.get('files', {})
        summary = data.get('totals', {})
        
        # 按模块分组
        modules = {
            'api': [],
            'services': [],
            'repositories': [],
            'other': []
        }
        
        for file_path, file_data in files.items():
            coverage_percent = file_data['summary']['percent_covered']
            missing_lines = file_data['missing_lines']
            
            file_info = {
                'path': file_path,
                'coverage': coverage_percent,
                'missing_lines': missing_lines,
                'total_lines': file_data['summary']['num_statements'],
                'covered_lines': file_data['summary']['covered_lines']
            }
            
            if 'api/' in file_path:
                modules['api'].append(file_info)
            elif 'services/' in file_path:
                modules['services'].append(file_info)
            elif 'repositories/' in file_path:
                modules['repositories'].append(file_info)
            else:
                modules['other'].append(file_info)
        
        return {
            'summary': summary,
            'modules': modules,
            'total_files': len(files)
        }
    
    def generate_report(self) -> None:
        """生成详细的覆盖率报告"""
        print("\n📊 生成覆盖率分析报告...")
        
        analysis = self.analyze_coverage_data()
        if not analysis:
            return
        
        self._print_summary(analysis['summary'])
        self._print_module_analysis(analysis['modules'])
        self._print_recommendations(analysis)
        self._generate_markdown_report(analysis)
    
    def _print_summary(self, summary: Dict) -> None:
        """打印总体摘要"""
        print("\n" + "="*60)
        print("📈 覆盖率总体摘要")
        print("="*60)
        
        total_percent = summary.get('percent_covered', 0)
        total_lines = summary.get('num_statements', 0)
        covered_lines = summary.get('covered_lines', 0)
        missing_lines = summary.get('missing_lines', 0)
        
        print(f"总体覆盖率: {total_percent:.1f}%")
        print(f"总代码行数: {total_lines}")
        print(f"已覆盖行数: {covered_lines}")
        print(f"未覆盖行数: {missing_lines}")
        
        # 覆盖率等级
        if total_percent >= 90:
            grade = "🟢 优秀"
        elif total_percent >= 80:
            grade = "🟡 良好"
        elif total_percent >= 70:
            grade = "🟠 一般"
        else:
            grade = "🔴 需要改进"
        
        print(f"覆盖率等级: {grade}")
    
    def _print_module_analysis(self, modules: Dict[str, List]) -> None:
        """打印模块分析"""
        print("\n" + "="*60)
        print("📂 模块覆盖率分析")
        print("="*60)
        
        for module_name, files in modules.items():
            if not files:
                continue
            
            print(f"\n📁 {module_name.upper()} 模块:")
            
            # 计算模块平均覆盖率
            total_lines = sum(f['total_lines'] for f in files)
            covered_lines = sum(f['covered_lines'] for f in files)
            module_coverage = (covered_lines / total_lines * 100) if total_lines > 0 else 0
            
            print(f"   模块覆盖率: {module_coverage:.1f}%")
            print(f"   文件数量: {len(files)}")
            
            # 显示覆盖率最低的文件
            low_coverage_files = [f for f in files if f['coverage'] < 50]
            if low_coverage_files:
                print(f"   ⚠️  低覆盖率文件 (<50%):")
                for file_info in sorted(low_coverage_files, key=lambda x: x['coverage']):
                    print(f"      - {file_info['path']}: {file_info['coverage']:.1f}%")
    
    def _print_recommendations(self, analysis: Dict) -> None:
        """打印改进建议"""
        print("\n" + "="*60)
        print("💡 改进建议")
        print("="*60)
        
        total_coverage = analysis['summary'].get('percent_covered', 0)
        modules = analysis['modules']
        
        recommendations = []
        
        if total_coverage < 80:
            recommendations.append("🎯 总体覆盖率偏低，建议优先提升到80%以上")
        
        # 检查各模块
        for module_name, files in modules.items():
            if not files:
                continue
            
            total_lines = sum(f['total_lines'] for f in files)
            covered_lines = sum(f['covered_lines'] for f in files)
            module_coverage = (covered_lines / total_lines * 100) if total_lines > 0 else 0
            
            if module_coverage < 70:
                recommendations.append(f"📂 {module_name} 模块覆盖率较低 ({module_coverage:.1f}%)，需要重点关注")
            
            # 找出最需要测试的文件
            uncovered_files = [f for f in files if f['coverage'] < 30]
            if uncovered_files:
                for file_info in uncovered_files[:3]:  # 只显示前3个
                    recommendations.append(f"📄 {file_info['path']} 急需添加测试 ({file_info['coverage']:.1f}%)")
        
        if not recommendations:
            recommendations.append("🎉 覆盖率表现良好，继续保持！")
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
    
    def _generate_markdown_report(self, analysis: Dict) -> None:
        """生成Markdown格式的报告"""
        report_path = self.project_root / "tests" / "COVERAGE_REPORT.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 测试覆盖率报告\n\n")
            f.write(f"生成时间: {self._get_current_time()}\n\n")
            
            # 总体摘要
            summary = analysis['summary']
            f.write("## 📊 总体摘要\n\n")
            f.write(f"- **总体覆盖率**: {summary.get('percent_covered', 0):.1f}%\n")
            f.write(f"- **总代码行数**: {summary.get('num_statements', 0)}\n")
            f.write(f"- **已覆盖行数**: {summary.get('covered_lines', 0)}\n")
            f.write(f"- **未覆盖行数**: {summary.get('missing_lines', 0)}\n\n")
            
            # 模块详情
            f.write("## 📂 模块详情\n\n")
            for module_name, files in analysis['modules'].items():
                if not files:
                    continue
                
                f.write(f"### {module_name.upper()} 模块\n\n")
                f.write("| 文件 | 覆盖率 | 总行数 | 已覆盖 | 未覆盖行 |\n")
                f.write("|------|--------|--------|--------|----------|\n")
                
                for file_info in sorted(files, key=lambda x: x['coverage']):
                    missing_lines = ', '.join(map(str, file_info['missing_lines'][:5]))
                    if len(file_info['missing_lines']) > 5:
                        missing_lines += "..."
                    
                    f.write(f"| {file_info['path']} | {file_info['coverage']:.1f}% | "
                           f"{file_info['total_lines']} | {file_info['covered_lines']} | "
                           f"{missing_lines} |\n")
                f.write("\n")
            
            f.write("## 🎯 下一步行动\n\n")
            f.write("1. 优先为覆盖率低于50%的文件添加测试\n")
            f.write("2. 关注核心业务逻辑的测试覆盖\n")
            f.write("3. 定期运行覆盖率分析，保持测试质量\n")
        
        print(f"\n📝 详细报告已保存到: {report_path}")
    
    def _get_current_time(self) -> str:
        """获取当前时间字符串"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def run_performance_tests(self) -> None:
        """运行性能测试"""
        print("\n🚀 运行性能测试...")
        
        cmd = [
            "python", "-m", "pytest",
            "tests/test_performance.py",
            "-v", "-m", "performance"
        ]
        
        try:
            result = subprocess.run(cmd, cwd=self.project_root)
            if result.returncode == 0:
                print("✅ 性能测试完成")
            else:
                print("❌ 性能测试失败")
        except Exception as e:
            print(f"❌ 运行性能测试时出错: {e}")


def main():
    """主函数"""
    analyzer = CoverageAnalyzer()
    
    print("🔍 PhoenixCoder 测试覆盖率分析工具")
    print("="*50)
    
    # 运行覆盖率测试
    if analyzer.run_coverage_tests():
        analyzer.generate_report()
    
    # 询问是否运行性能测试
    if len(sys.argv) > 1 and sys.argv[1] == "--performance":
        analyzer.run_performance_tests()


if __name__ == "__main__":
    main()