#!/usr/bin/env python3
"""高级测试运行脚本"""

import os
import sys
import argparse
import subprocess
from pathlib import Path


class TestRunner:
    """测试运行器"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.tests_dir = self.project_root / "tests"
    
    def run_basic_tests(self, verbose: bool = True) -> bool:
        """运行基础测试"""
        print("🧪 运行基础测试套件...")
        
        cmd = ["python", "-m", "pytest", "tests/", "-x"]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_unit_tests(self, verbose: bool = True) -> bool:
        """运行单元测试"""
        print("🔬 运行单元测试...")
        
        cmd = ["python", "-m", "pytest", "tests/", "-m", "unit"]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_integration_tests(self, verbose: bool = True) -> bool:
        """运行集成测试"""
        print("🔗 运行集成测试...")
        
        cmd = ["python", "-m", "pytest", "tests/", "-m", "integration"]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_performance_tests(self, verbose: bool = True) -> bool:
        """运行性能测试"""
        print("🚀 运行性能测试...")
        
        cmd = ["python", "-m", "pytest", "tests/test_performance.py", "-m", "performance"]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_stress_tests(self, verbose: bool = True) -> bool:
        """运行压力测试"""
        print("💪 运行压力测试...")
        
        cmd = ["python", "-m", "pytest", "tests/test_performance.py", "-m", "stress"]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_coverage_analysis(self) -> bool:
        """运行覆盖率分析"""
        print("📊 运行覆盖率分析...")
        
        cmd = ["python", "tests/coverage_analysis.py"]
        return self._run_command(cmd)
    
    def run_specific_module(self, module: str, verbose: bool = True) -> bool:
        """运行特定模块的测试"""
        print(f"🎯 运行 {module} 模块测试...")
        
        cmd = ["python", "-m", "pytest", "tests/", "-m", module]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_specific_file(self, file_path: str, verbose: bool = True) -> bool:
        """运行特定文件的测试"""
        print(f"📄 运行测试文件: {file_path}")
        
        cmd = ["python", "-m", "pytest", file_path]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_failed_tests(self, verbose: bool = True) -> bool:
        """重新运行失败的测试"""
        print("🔄 重新运行失败的测试...")
        
        cmd = ["python", "-m", "pytest", "--lf"]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_parallel_tests(self, workers: int = 4, verbose: bool = True) -> bool:
        """并行运行测试"""
        print(f"⚡ 并行运行测试 (workers: {workers})...")
        
        cmd = ["python", "-m", "pytest", "tests/", "-n", str(workers)]
        if verbose:
            cmd.append("-v")
        
        return self._run_command(cmd)
    
    def run_full_suite(self) -> bool:
        """运行完整测试套件"""
        print("🎪 运行完整测试套件...")
        
        tests = [
            ("基础测试", self.run_basic_tests),
            ("单元测试", self.run_unit_tests),
            ("集成测试", self.run_integration_tests),
            ("性能测试", self.run_performance_tests),
            ("覆盖率分析", self.run_coverage_analysis)
        ]
        
        results = {}
        for test_name, test_func in tests:
            print(f"\n{'='*50}")
            print(f"执行: {test_name}")
            print('='*50)
            
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ {test_name} 执行失败: {e}")
                results[test_name] = False
        
        # 打印总结
        print(f"\n{'='*50}")
        print("📋 测试套件执行总结")
        print('='*50)
        
        for test_name, success in results.items():
            status = "✅ 通过" if success else "❌ 失败"
            print(f"{test_name}: {status}")
        
        all_passed = all(results.values())
        print(f"\n总体结果: {'🎉 全部通过' if all_passed else '⚠️ 部分失败'}")
        
        return all_passed
    
    def _run_command(self, cmd: list) -> bool:
        """运行命令"""
        try:
            result = subprocess.run(cmd, cwd=self.project_root)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ 命令执行失败: {e}")
            return False
    
    def list_available_tests(self) -> None:
        """列出可用的测试"""
        print("📋 可用的测试类型:")
        print("  • basic      - 基础测试套件")
        print("  • unit       - 单元测试")
        print("  • integration - 集成测试")
        print("  • performance - 性能测试")
        print("  • stress     - 压力测试")
        print("  • coverage   - 覆盖率分析")
        print("  • auth       - 认证模块测试")
        print("  • growth     - 成长模块测试")
        print("  • skills     - 技能模块测试")
        print("  • full       - 完整测试套件")
        
        print("\n📁 可用的测试文件:")
        for test_file in self.tests_dir.glob("test_*.py"):
            print(f"  • {test_file.name}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="PhoenixCoder 高级测试运行器")
    parser.add_argument("test_type", nargs="?", default="basic",
                       help="测试类型 (basic, unit, integration, performance, stress, coverage, full)")
    parser.add_argument("-v", "--verbose", action="store_true",
                       help="详细输出")
    parser.add_argument("-f", "--file", type=str,
                       help="运行特定测试文件")
    parser.add_argument("-m", "--module", type=str,
                       help="运行特定模块测试")
    parser.add_argument("--failed", action="store_true",
                       help="重新运行失败的测试")
    parser.add_argument("--parallel", type=int, metavar="N",
                       help="并行运行测试 (指定worker数量)")
    parser.add_argument("--list", action="store_true",
                       help="列出可用的测试")
    
    args = parser.parse_args()
    
    runner = TestRunner()
    
    if args.list:
        runner.list_available_tests()
        return
    
    print("🧪 PhoenixCoder 高级测试运行器")
    print("="*40)
    
    success = False
    
    try:
        if args.file:
            success = runner.run_specific_file(args.file, args.verbose)
        elif args.module:
            success = runner.run_specific_module(args.module, args.verbose)
        elif args.failed:
            success = runner.run_failed_tests(args.verbose)
        elif args.parallel:
            success = runner.run_parallel_tests(args.parallel, args.verbose)
        elif args.test_type == "basic":
            success = runner.run_basic_tests(args.verbose)
        elif args.test_type == "unit":
            success = runner.run_unit_tests(args.verbose)
        elif args.test_type == "integration":
            success = runner.run_integration_tests(args.verbose)
        elif args.test_type == "performance":
            success = runner.run_performance_tests(args.verbose)
        elif args.test_type == "stress":
            success = runner.run_stress_tests(args.verbose)
        elif args.test_type == "coverage":
            success = runner.run_coverage_analysis()
        elif args.test_type == "auth":
            success = runner.run_specific_module("auth", args.verbose)
        elif args.test_type == "growth":
            success = runner.run_specific_module("growth", args.verbose)
        elif args.test_type == "skills":
            success = runner.run_specific_module("skills", args.verbose)
        elif args.test_type == "full":
            success = runner.run_full_suite()
        else:
            print(f"❌ 未知的测试类型: {args.test_type}")
            runner.list_available_tests()
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n⚠️ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 运行测试时出错: {e}")
        sys.exit(1)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()