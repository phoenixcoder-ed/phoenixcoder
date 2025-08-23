#!/usr/bin/env python3
"""
Pytest 智能测试配置
提供智能测试选择、并行执行、覆盖率监控等功能
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Set, Optional
from dataclasses import dataclass
from enum import Enum


class TestLevel(Enum):
    """测试级别枚举"""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    PERFORMANCE = "performance"
    SECURITY = "security"


class TestSpeed(Enum):
    """测试速度枚举"""
    FAST = "fast"  # < 1s
    MEDIUM = "medium"  # 1-10s
    SLOW = "slow"  # > 10s


@dataclass
class TestConfig:
    """测试配置类"""
    level: TestLevel
    speed: TestSpeed
    parallel: bool = True
    coverage: bool = True
    timeout: int = 300
    max_workers: Optional[int] = None
    markers: List[str] = None
    exclude_markers: List[str] = None


class IntelligentTestRunner:
    """智能测试运行器"""
    
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path.cwd()
        self.test_configs = self._load_test_configs()
        
    def _load_test_configs(self) -> Dict[str, TestConfig]:
        """加载测试配置"""
        return {
            "unit": TestConfig(
                level=TestLevel.UNIT,
                speed=TestSpeed.FAST,
                parallel=True,
                coverage=True,
                timeout=60,
                max_workers=8,
                markers=["unit", "fast"],
                exclude_markers=["slow", "integration", "e2e"]
            ),
            "integration": TestConfig(
                level=TestLevel.INTEGRATION,
                speed=TestSpeed.MEDIUM,
                parallel=True,
                coverage=True,
                timeout=300,
                max_workers=4,
                markers=["integration"],
                exclude_markers=["e2e", "performance"]
            ),
            "e2e": TestConfig(
                level=TestLevel.E2E,
                speed=TestSpeed.SLOW,
                parallel=False,
                coverage=False,
                timeout=600,
                max_workers=1,
                markers=["e2e"],
                exclude_markers=["unit", "integration"]
            ),
            "performance": TestConfig(
                level=TestLevel.PERFORMANCE,
                speed=TestSpeed.SLOW,
                parallel=False,
                coverage=False,
                timeout=900,
                max_workers=1,
                markers=["performance", "benchmark"],
                exclude_markers=["unit", "integration", "e2e"]
            ),
            "security": TestConfig(
                level=TestLevel.SECURITY,
                speed=TestSpeed.MEDIUM,
                parallel=True,
                coverage=False,
                timeout=300,
                max_workers=2,
                markers=["security"],
                exclude_markers=["unit", "integration", "e2e"]
            )
        }
    
    def get_changed_files(self) -> List[str]:
        """获取变更的文件列表"""
        try:
            # 获取git变更的文件
            result = subprocess.run(
                ["git", "diff", "--name-only", "HEAD~1"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            if result.returncode == 0:
                return [f for f in result.stdout.strip().split('\n') if f]
        except Exception:
            pass
        return []
    
    def analyze_test_impact(self, changed_files: List[str]) -> Set[str]:
        """分析变更文件对测试的影响"""
        affected_tests = set()
        
        for file_path in changed_files:
            if not file_path:
                continue
                
            # 直接测试文件
            if file_path.startswith('tests/') and file_path.endswith('.py'):
                affected_tests.add(file_path)
                continue
            
            # 源代码文件，查找对应的测试文件
            if file_path.endswith('.py'):
                # 移除src/前缀和.py后缀
                module_path = file_path.replace('src/', '').replace('.py', '')
                
                # 可能的测试文件路径
                possible_test_files = [
                    f"tests/test_{module_path.replace('/', '_')}.py",
                    f"tests/{module_path}/test_{Path(module_path).name}.py",
                    f"tests/unit/test_{Path(module_path).name}.py",
                    f"tests/integration/test_{Path(module_path).name}.py"
                ]
                
                for test_file in possible_test_files:
                    test_path = self.project_root / test_file
                    if test_path.exists():
                        affected_tests.add(test_file)
        
        return affected_tests
    
    def build_pytest_command(self, config: TestConfig, test_files: List[str] = None) -> List[str]:
        """构建pytest命令"""
        cmd = ["python", "-m", "pytest"]
        
        # 添加测试文件或目录
        if test_files:
            cmd.extend(test_files)
        else:
            cmd.append("tests/")
        
        # 添加标记过滤
        if config.markers:
            markers_expr = " or ".join(config.markers)
            cmd.extend(["-m", markers_expr])
        
        if config.exclude_markers:
            exclude_expr = " and ".join([f"not {marker}" for marker in config.exclude_markers])
            if config.markers:
                cmd[-1] = f"({cmd[-1]}) and ({exclude_expr})"
            else:
                cmd.extend(["-m", exclude_expr])
        
        # 并行执行配置
        if config.parallel and config.max_workers:
            cmd.extend(["-n", str(config.max_workers)])
        elif config.parallel:
            cmd.extend(["-n", "auto"])
        
        # 覆盖率配置
        if config.coverage:
            cmd.extend([
                "--cov=src",
                "--cov-report=html:htmlcov",
                "--cov-report=xml:coverage.xml",
                "--cov-report=term-missing"
            ])
        
        # 超时配置
        cmd.extend(["--timeout", str(config.timeout)])
        
        # 输出配置
        cmd.extend([
            "--verbose",
            "--tb=short",
            "--durations=10",
            "--maxfail=5"
        ])
        
        # JSON报告
        cmd.extend(["--json-report", "--json-report-file=test-report.json"])
        
        # HTML报告
        cmd.extend(["--html=test-report.html", "--self-contained-html"])
        
        return cmd
    
    def run_smart_tests(self, test_type: str = "unit", changed_only: bool = False) -> int:
        """运行智能测试"""
        if test_type not in self.test_configs:
            print(f"错误: 未知的测试类型 '{test_type}'")
            print(f"可用的测试类型: {list(self.test_configs.keys())}")
            return 1
        
        config = self.test_configs[test_type]
        test_files = []
        
        if changed_only:
            changed_files = self.get_changed_files()
            if changed_files:
                affected_tests = self.analyze_test_impact(changed_files)
                test_files = list(affected_tests)
                print(f"检测到 {len(changed_files)} 个变更文件")
                print(f"影响 {len(test_files)} 个测试文件")
            else:
                print("未检测到文件变更，跳过测试")
                return 0
        
        # 构建并执行pytest命令
        cmd = self.build_pytest_command(config, test_files)
        
        print(f"执行 {test_type} 测试...")
        print(f"命令: {' '.join(cmd)}")
        
        # 确保日志目录存在
        log_dir = self.project_root / "tests" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # 执行测试
        result = subprocess.run(cmd, cwd=self.project_root)
        return result.returncode
    
    def run_test_suite(self, levels: List[str] = None) -> Dict[str, int]:
        """运行测试套件"""
        if levels is None:
            levels = ["unit", "integration"]
        
        results = {}
        
        for level in levels:
            print(f"\n{'='*50}")
            print(f"运行 {level.upper()} 测试")
            print(f"{'='*50}")
            
            result_code = self.run_smart_tests(level)
            results[level] = result_code
            
            if result_code != 0:
                print(f"\n❌ {level} 测试失败 (退出码: {result_code})")
                break
            else:
                print(f"\n✅ {level} 测试通过")
        
        return results


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="智能测试运行器")
    parser.add_argument(
        "test_type",
        choices=["unit", "integration", "e2e", "performance", "security", "all"],
        help="测试类型"
    )
    parser.add_argument(
        "--changed-only",
        action="store_true",
        help="只运行受变更影响的测试"
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="项目根目录"
    )
    
    args = parser.parse_args()
    
    runner = IntelligentTestRunner(args.project_root)
    
    if args.test_type == "all":
        results = runner.run_test_suite(["unit", "integration", "e2e"])
        
        print("\n" + "="*50)
        print("测试结果汇总")
        print("="*50)
        
        all_passed = True
        for test_type, result_code in results.items():
            status = "✅ 通过" if result_code == 0 else "❌ 失败"
            print(f"{test_type.upper()}: {status}")
            if result_code != 0:
                all_passed = False
        
        return 0 if all_passed else 1
    else:
        return runner.run_smart_tests(args.test_type, args.changed_only)


if __name__ == "__main__":
    sys.exit(main())