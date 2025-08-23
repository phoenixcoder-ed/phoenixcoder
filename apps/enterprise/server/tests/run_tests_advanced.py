#!/usr/bin/env python3
"""
PhoenixCoder 高级测试运行器
支持多种测试类型和配置选项
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional

class TestRunner:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        
    def run_command(self, cmd: List[str], description: str) -> bool:
        """运行命令并显示结果"""
        print(f"\n🚀 {description}")
        print(f"命令: {' '.join(cmd)}")
        print("-" * 60)
        
        start_time = time.time()
        try:
            result = subprocess.run(cmd, cwd=self.project_root, text=True)
            end_time = time.time()
            
            if result.returncode == 0:
                print(f"✅ 成功完成 (耗时: {end_time - start_time:.2f}s)")
                return True
            else:
                print(f"❌ 执行失败 (退出码: {result.returncode})")
                return False
        except Exception as e:
            print(f"❌ 执行出错: {e}")
            return False
    
    def run_basic_tests(self) -> bool:
        """运行基础测试"""
        cmd = ["python", "-m", "pytest", "tests/", "-v"]
        return self.run_command(cmd, "运行所有基础测试")
    
    def run_unit_tests(self) -> bool:
        """运行单元测试"""
        cmd = ["python", "-m", "pytest", "tests/", "-m", "unit", "-v"]
        return self.run_command(cmd, "运行单元测试")
    
    def run_integration_tests(self) -> bool:
        """运行集成测试"""
        cmd = ["python", "-m", "pytest", "tests/", "-m", "integration", "-v"]
        return self.run_command(cmd, "运行集成测试")
    
    def run_performance_tests(self) -> bool:
        """运行性能测试"""
        cmd = ["python", "-m", "pytest", "tests/test_performance.py", "-v", "-s"]
        return self.run_command(cmd, "运行性能测试")
    
    def run_stress_tests(self) -> bool:
        """运行压力测试"""
        cmd = ["python", "-m", "pytest", "tests/", "-m", "stress", "-v", "-s"]
        return self.run_command(cmd, "运行压力测试")
    
    def run_coverage_analysis(self) -> bool:
        """运行覆盖率分析"""
        cmd = ["python", "tests/coverage_analysis.py"]
        return self.run_command(cmd, "运行覆盖率分析")
    
    def run_specific_file(self, file_path: str) -> bool:
        """运行特定测试文件"""
        cmd = ["python", "-m", "pytest", file_path, "-v"]
        return self.run_command(cmd, f"运行测试文件: {file_path}")
    
    def run_specific_module(self, module: str) -> bool:
        """运行特定模块的测试"""
        cmd = ["python", "-m", "pytest", "tests/", "-m", module, "-v"]
        return self.run_command(cmd, f"运行 {module} 模块测试")
    
    def run_failed_tests(self) -> bool:
        """重新运行失败的测试"""
        cmd = ["python", "-m", "pytest", "--lf", "-v"]
        return self.run_command(cmd, "重新运行失败的测试")
    
    def run_parallel_tests(self, workers: int = 4) -> bool:
        """并行运行测试"""
        cmd = ["python", "-m", "pytest", "tests/", "-n", str(workers), "-v"]
        return self.run_command(cmd, f"并行运行测试 (工作进程: {workers})")

def main():
    parser = argparse.ArgumentParser(description="PhoenixCoder 高级测试运行器")
    
    # 测试类型选项
    parser.add_argument("--basic", action="store_true", help="运行基础测试")
    parser.add_argument("--unit", action="store_true", help="运行单元测试")
    parser.add_argument("--integration", action="store_true", help="运行集成测试")
    parser.add_argument("--performance", action="store_true", help="运行性能测试")
    parser.add_argument("--stress", action="store_true", help="运行压力测试")
    parser.add_argument("--coverage", action="store_true", help="运行覆盖率分析")
    
    # 特定测试选项
    parser.add_argument("--file", type=str, help="运行特定测试文件")
    parser.add_argument("--module", type=str, help="运行特定模块测试 (如: auth, growth, skills)")
    parser.add_argument("--failed", action="store_true", help="重新运行失败的测试")
    
    # 执行选项
    parser.add_argument("--parallel", type=int, metavar="N", help="并行运行测试 (指定工作进程数)")
    parser.add_argument("--all", action="store_true", help="运行所有类型的测试")
    
    args = parser.parse_args()
    
    # 如果没有指定任何选项，显示帮助
    if not any(vars(args).values()):
        parser.print_help()
        return
    
    runner = TestRunner()
    success_count = 0
    total_count = 0
    
    print("🧪 PhoenixCoder 高级测试运行器")
    print("=" * 60)
    
    # 运行指定的测试
    if args.basic or args.all:
        total_count += 1
        if runner.run_basic_tests():
            success_count += 1
    
    if args.unit or args.all:
        total_count += 1
        if runner.run_unit_tests():
            success_count += 1
    
    if args.integration or args.all:
        total_count += 1
        if runner.run_integration_tests():
            success_count += 1
    
    if args.performance or args.all:
        total_count += 1
        if runner.run_performance_tests():
            success_count += 1
    
    if args.stress or args.all:
        total_count += 1
        if runner.run_stress_tests():
            success_count += 1
    
    if args.coverage or args.all:
        total_count += 1
        if runner.run_coverage_analysis():
            success_count += 1
    
    if args.file:
        total_count += 1
        if runner.run_specific_file(args.file):
            success_count += 1
    
    if args.module:
        total_count += 1
        if runner.run_specific_module(args.module):
            success_count += 1
    
    if args.failed:
        total_count += 1
        if runner.run_failed_tests():
            success_count += 1
    
    if args.parallel:
        total_count += 1
        if runner.run_parallel_tests(args.parallel):
            success_count += 1
    
    # 显示总结
    print("\n" + "=" * 60)
    print(f"📊 测试运行总结: {success_count}/{total_count} 成功")
    
    if success_count == total_count:
        print("🎉 所有测试运行成功！")
        sys.exit(0)
    else:
        print("⚠️  部分测试运行失败")
        sys.exit(1)

if __name__ == "__main__":
    main()