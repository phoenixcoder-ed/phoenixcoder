# PhoenixCoder 服务器 Makefile

.PHONY: help install test test-unit test-growth test-skills test-auth coverage lint format clean

# 默认目标
help:
	@echo "PhoenixCoder 服务器开发工具"
	@echo ""
	@echo "可用命令:"
	@echo "  install     - 安装依赖"
	@echo "  test        - 运行所有测试"
	@echo "  test-unit   - 运行单元测试"
	@echo "  test-growth - 运行成长模块测试"
	@echo "  test-skills - 运行技能模块测试"
	@echo "  test-auth   - 运行认证模块测试"
	@echo "  coverage    - 生成测试覆盖率报告"
	@echo "  lint        - 代码检查"
	@echo "  format      - 代码格式化"
	@echo "  clean       - 清理临时文件"
	@echo "  dev         - 启动开发服务器"

# 安装依赖
install:
	@echo "📦 安装项目依赖..."
	pip install -r requirements.txt
	pip install -r requirements-test.txt

# 运行所有测试
test:
	@echo "🧪 运行所有测试..."
	python run_tests.py

# 运行单元测试
test-unit:
	@echo "🧪 运行单元测试..."
	pytest tests/ -v -m unit

# 运行成长模块测试
test-growth:
	@echo "🧪 运行成长模块测试..."
	pytest tests/test_growth_api.py -v

# 运行技能模块测试
test-skills:
	@echo "🧪 运行技能模块测试..."
	pytest tests/test_skills_api.py -v

# 运行认证模块测试
test-auth:
	@echo "🧪 运行认证模块测试..."
	pytest tests/test_auth_api.py -v

# 生成测试覆盖率报告
coverage:
	@echo "📊 生成测试覆盖率报告..."
	pytest tests/ --cov=api --cov-report=html --cov-report=term-missing
	@echo "📄 HTML报告已生成到 htmlcov/ 目录"

# 代码检查
lint:
	@echo "🔍 代码检查..."
	flake8 api/ tests/
	black --check api/ tests/
	isort --check-only api/ tests/

# 代码格式化
format:
	@echo "✨ 代码格式化..."
	black api/ tests/
	isort api/ tests/

# 清理临时文件
clean:
	@echo "🧹 清理临时文件..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage

# 启动开发服务器
dev:
	@echo "🚀 启动开发服务器..."
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 快速测试（仅运行失败的测试）
test-fast:
	@echo "⚡ 快速测试..."
	pytest tests/ -v --lf --tb=short

# 测试特定文件
test-file:
	@echo "🎯 测试指定文件..."
	@read -p "请输入测试文件路径: " file; \
	pytest $$file -v

# 安装pre-commit钩子
install-hooks:
	@echo "🪝 安装pre-commit钩子..."
	pip install pre-commit
	pre-commit install

# 运行类型检查
typecheck:
	@echo "🔍 类型检查..."
	mypy api/ --ignore-missing-imports