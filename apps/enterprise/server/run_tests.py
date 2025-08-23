#!/usr/bin/env python3
"""
测试运行脚本
"""
import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    """运行命令并处理结果"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.stderr:
            print("警告:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 错误: {e}")
        print(f"输出: {e.stdout}")
        print(f"错误: {e.stderr}")
        return False


def main():
    """主函数"""
    # 确保在正确的目录中
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🧪 PhoenixCoder 服务器单元测试")
    print(f"📁 工作目录: {os.getcwd()}")
    
    # 检查是否安装了测试依赖
    print("\n📦 检查测试依赖...")
    if not run_command("pip list | grep pytest", "检查pytest是否安装"):
        print("⚠️  pytest未安装，正在安装测试依赖...")
        if not run_command("pip install -r requirements-test.txt", "安装测试依赖"):
            print("❌ 安装测试依赖失败")
            return False
    
    # 运行代码格式检查
    print("\n🔍 代码格式检查...")
    run_command("black --check --diff api/ tests/", "Black代码格式检查")
    run_command("isort --check-only --diff api/ tests/", "isort导入排序检查")
    run_command("flake8 api/ tests/", "flake8代码风格检查")
    
    # 运行单元测试
    test_commands = [
        {
            "command": "pytest tests/ -v --tb=short",
            "description": "运行所有单元测试"
        },
        {
            "command": "pytest tests/ -v --tb=short -m unit",
            "description": "运行单元测试（仅unit标记）"
        },
        {
            "command": "pytest tests/test_growth_api.py -v",
            "description": "运行成长模块测试"
        },
        {
            "command": "pytest tests/test_skills_api.py -v",
            "description": "运行技能模块测试"
        },
        {
            "command": "pytest tests/test_auth_api.py -v",
            "description": "运行认证模块测试"
        }
    ]
    
    success_count = 0
    for test in test_commands:
        if run_command(test["command"], test["description"]):
            success_count += 1
    
    # 生成覆盖率报告
    print("\n📊 生成测试覆盖率报告...")
    run_command(
        "pytest tests/ --cov=api --cov-report=html --cov-report=term-missing",
        "生成覆盖率报告"
    )
    
    # 总结
    print(f"\n{'='*60}")
    print(f"📋 测试总结")
    print(f"{'='*60}")
    print(f"✅ 成功: {success_count}/{len(test_commands)} 个测试套件")
    
    if success_count == len(test_commands):
        print("🎉 所有测试通过！")
        return True
    else:
        print("⚠️  部分测试失败，请检查上述输出")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)