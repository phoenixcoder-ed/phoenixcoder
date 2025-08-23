#!/usr/bin/env python3
"""
智能测试运行脚本
提供便捷的测试执行命令和测试策略
"""

import os
import sys
import time
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# 添加tests目录到Python路径
sys.path.insert(0, str(Path(__file__).parent / "tests"))

from tests.pytest_config import IntelligentTestRunner, TestLevel


class TestReportGenerator:
    """测试报告生成器"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.reports_dir = project_root / "test-reports"
        self.reports_dir.mkdir(exist_ok=True)
    
    def generate_summary_report(self, results: Dict[str, int]) -> str:
        """生成测试结果汇总报告"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report = f"""
# 测试执行报告

**执行时间**: {timestamp}

## 测试结果汇总

| 测试类型 | 状态 | 退出码 |
|---------|------|--------|
"""
        
        total_tests = len(results)
        passed_tests = sum(1 for code in results.values() if code == 0)
        
        for test_type, exit_code in results.items():
            status = "✅ 通过" if exit_code == 0 else "❌ 失败"
            report += f"| {test_type.upper()} | {status} | {exit_code} |\n"
        
        report += f"""

## 统计信息

- **总测试套件**: {total_tests}
- **通过套件**: {passed_tests}
- **失败套件**: {total_tests - passed_tests}
- **成功率**: {(passed_tests / total_tests * 100):.1f}%

## 详细报告

- HTML报告: `test-report.html`
- 覆盖率报告: `htmlcov/index.html`
- JSON报告: `test-report.json`
"""
        
        # 保存报告
        report_file = self.reports_dir / f"test-summary-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
        report_file.write_text(report, encoding='utf-8')
        
        return str(report_file)
    
    def parse_coverage_report(self) -> Optional[Dict]:
        """解析覆盖率报告"""
        coverage_file = self.project_root / "coverage.xml"
        if not coverage_file.exists():
            return None
        
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(coverage_file)
            root = tree.getroot()
            
            coverage_data = {
                "line_rate": float(root.get("line-rate", 0)) * 100,
                "branch_rate": float(root.get("branch-rate", 0)) * 100,
                "lines_covered": int(root.get("lines-covered", 0)),
                "lines_valid": int(root.get("lines-valid", 0)),
                "branches_covered": int(root.get("branches-covered", 0)),
                "branches_valid": int(root.get("branches-valid", 0))
            }
            
            return coverage_data
        except Exception as e:
            print(f"解析覆盖率报告失败: {e}")
            return None


class TestEnvironmentManager:
    """测试环境管理器"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
    
    def setup_test_environment(self):
        """设置测试环境"""
        print("🔧 设置测试环境...")
        
        # 设置环境变量
        test_env = {
            "ENVIRONMENT": "test",
            "DATABASE_URL": "sqlite:///test.db",
            "REDIS_URL": "redis://localhost:6379/1",
            "JWT_SECRET_KEY": "test-secret-key",
            "LOG_LEVEL": "WARNING",
            "TESTING": "true"
        }
        
        for key, value in test_env.items():
            os.environ[key] = value
        
        # 创建必要的目录
        dirs_to_create = [
            "tests/logs",
            "test-reports",
            "htmlcov"
        ]
        
        for dir_path in dirs_to_create:
            (self.project_root / dir_path).mkdir(parents=True, exist_ok=True)
        
        print("✅ 测试环境设置完成")
    
    def cleanup_test_environment(self):
        """清理测试环境"""
        print("🧹 清理测试环境...")
        
        # 清理测试数据库
        test_db = self.project_root / "test.db"
        if test_db.exists():
            test_db.unlink()
        
        # 清理临时文件
        temp_files = [
            ".coverage",
            "test-report.json",
            "test-report.html"
        ]
        
        for file_path in temp_files:
            file_obj = self.project_root / file_path
            if file_obj.exists():
                file_obj.unlink()
        
        print("✅ 测试环境清理完成")


def run_quick_tests():
    """运行快速测试 (单元测试)"""
    print("🚀 运行快速测试 (单元测试)...")
    runner = IntelligentTestRunner()
    return runner.run_smart_tests("unit")


def run_changed_tests():
    """运行变更相关的测试"""
    print("🔍 运行变更相关的测试...")
    runner = IntelligentTestRunner()
    return runner.run_smart_tests("unit", changed_only=True)


def run_integration_tests():
    """运行集成测试"""
    print("🔗 运行集成测试...")
    runner = IntelligentTestRunner()
    return runner.run_smart_tests("integration")


def run_full_test_suite():
    """运行完整测试套件"""
    print("🎯 运行完整测试套件...")
    
    project_root = Path.cwd()
    env_manager = TestEnvironmentManager(project_root)
    report_generator = TestReportGenerator(project_root)
    runner = IntelligentTestRunner(project_root)
    
    # 设置测试环境
    env_manager.setup_test_environment()
    
    start_time = time.time()
    
    try:
        # 运行测试套件
        results = runner.run_test_suite(["unit", "integration"])
        
        # 生成报告
        report_file = report_generator.generate_summary_report(results)
        
        # 解析覆盖率
        coverage_data = report_generator.parse_coverage_report()
        if coverage_data:
            print(f"\n📊 代码覆盖率: {coverage_data['line_rate']:.1f}%")
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n⏱️  总执行时间: {duration:.2f}秒")
        print(f"📄 详细报告: {report_file}")
        
        # 检查是否所有测试都通过
        all_passed = all(code == 0 for code in results.values())
        return 0 if all_passed else 1
        
    finally:
        # 清理测试环境
        env_manager.cleanup_test_environment()


def run_performance_tests():
    """运行性能测试"""
    print("⚡ 运行性能测试...")
    runner = IntelligentTestRunner()
    return runner.run_smart_tests("performance")


def run_security_tests():
    """运行安全测试"""
    print("🔒 运行安全测试...")
    runner = IntelligentTestRunner()
    return runner.run_smart_tests("security")


def install_test_dependencies():
    """安装测试依赖"""
    print("📦 安装测试依赖...")
    
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True
        )
        print("✅ 测试依赖安装完成")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ 测试依赖安装失败: {e}")
        return 1


def show_test_status():
    """显示测试状态"""
    print("📋 测试状态概览")
    print("="*50)
    
    project_root = Path.cwd()
    
    # 检查测试文件数量
    test_files = list(project_root.glob("tests/**/test_*.py"))
    print(f"测试文件数量: {len(test_files)}")
    
    # 检查覆盖率报告
    coverage_file = project_root / "htmlcov" / "index.html"
    if coverage_file.exists():
        print(f"覆盖率报告: {coverage_file}")
    else:
        print("覆盖率报告: 未生成")
    
    # 检查最新测试报告
    reports_dir = project_root / "test-reports"
    if reports_dir.exists():
        reports = list(reports_dir.glob("test-summary-*.md"))
        if reports:
            latest_report = max(reports, key=lambda p: p.stat().st_mtime)
            print(f"最新测试报告: {latest_report}")
        else:
            print("测试报告: 未生成")
    else:
        print("测试报告: 未生成")
    
    print("="*50)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="PhoenixCoder 智能测试运行器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  python run_tests.py quick          # 运行快速测试
  python run_tests.py changed        # 运行变更相关测试
  python run_tests.py integration    # 运行集成测试
  python run_tests.py full           # 运行完整测试套件
  python run_tests.py performance    # 运行性能测试
  python run_tests.py security       # 运行安全测试
  python run_tests.py install        # 安装测试依赖
  python run_tests.py status         # 显示测试状态
"""
    )
    
    parser.add_argument(
        "command",
        choices=[
            "quick", "changed", "integration", "full", 
            "performance", "security", "install", "status"
        ],
        help="测试命令"
    )
    
    args = parser.parse_args()
    
    # 命令映射
    commands = {
        "quick": run_quick_tests,
        "changed": run_changed_tests,
        "integration": run_integration_tests,
        "full": run_full_test_suite,
        "performance": run_performance_tests,
        "security": run_security_tests,
        "install": install_test_dependencies,
        "status": show_test_status
    }
    
    command_func = commands[args.command]
    
    if args.command == "status":
        command_func()
        return 0
    else:
        return command_func()


if __name__ == "__main__":
    sys.exit(main())