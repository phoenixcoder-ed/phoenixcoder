#!/usr/bin/env python3
"""
Django管理脚本
用于管理Django应用的各种操作
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings
from django.test.utils import get_runner


def configure_django():
    """配置Django设置"""
    if not settings.configured:
        settings.configure(
            DEBUG=True,
            DATABASES={
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': ':memory:',
                }
            },
            INSTALLED_APPS=[
                'django.contrib.auth',
                'django.contrib.contenttypes',
                'django.contrib.sessions',
                'django.contrib.messages',
                'django.contrib.staticfiles',
            ],
            SECRET_KEY='test-secret-key-for-ci',
            USE_TZ=True,
        )
        django.setup()


def run_tests():
    """运行Django测试"""
    configure_django()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # 运行测试
    failures = test_runner.run_tests(["tests"])
    
    if failures:
        print(f"❌ 测试失败: {failures} 个测试用例失败")
        sys.exit(1)
    else:
        print("✅ 所有测试通过")


def migrate_database():
    """执行数据库迁移"""
    configure_django()
    
    from django.core.management import call_command
    
    try:
        print("📊 执行数据库迁移...")
        call_command('migrate', verbosity=1, interactive=False)
        print("✅ 数据库迁移完成")
    except Exception as e:
        print(f"❌ 数据库迁移失败: {e}")
        sys.exit(1)


def collect_static():
    """收集静态文件"""
    configure_django()
    
    from django.core.management import call_command
    
    try:
        print("📁 收集静态文件...")
        call_command('collectstatic', verbosity=1, interactive=False)
        print("✅ 静态文件收集完成")
    except Exception as e:
        print(f"❌ 静态文件收集失败: {e}")
        sys.exit(1)


def check_deployment():
    """检查部署配置"""
    configure_django()
    
    from django.core.management import call_command
    
    try:
        print("🔍 检查部署配置...")
        call_command('check', '--deploy', verbosity=1)
        print("✅ 部署配置检查通过")
    except Exception as e:
        print(f"❌ 部署配置检查失败: {e}")
        sys.exit(1)


def create_superuser():
    """创建超级用户"""
    configure_django()
    
    from django.contrib.auth.models import User
    
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
    
    try:
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, email, password)
            print(f"✅ 超级用户 '{username}' 创建成功")
        else:
            print(f"ℹ️ 超级用户 '{username}' 已存在")
    except Exception as e:
        print(f"❌ 创建超级用户失败: {e}")
        sys.exit(1)


def load_fixtures():
    """加载测试数据"""
    configure_django()
    
    from django.core.management import call_command
    
    fixtures = [
        'initial_data.json',
        'test_data.json',
    ]
    
    for fixture in fixtures:
        if os.path.exists(f'fixtures/{fixture}'):
            try:
                print(f"📊 加载测试数据: {fixture}")
                call_command('loaddata', fixture, verbosity=1)
                print(f"✅ {fixture} 加载成功")
            except Exception as e:
                print(f"⚠️ {fixture} 加载失败: {e}")
        else:
            print(f"ℹ️ 测试数据文件不存在: {fixture}")


def show_urls():
    """显示URL配置"""
    configure_django()
    
    from django.core.management import call_command
    
    try:
        print("🔗 URL配置:")
        call_command('show_urls', verbosity=1)
    except Exception as e:
        print(f"❌ 显示URL配置失败: {e}")


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("""
🐍 Django管理脚本

可用命令:
  test          - 运行测试
  migrate       - 执行数据库迁移
  collectstatic - 收集静态文件
  check         - 检查部署配置
  createsuperuser - 创建超级用户
  loaddata      - 加载测试数据
  showurls      - 显示URL配置
  runserver     - 启动开发服务器
  shell         - 启动Django shell

使用方法:
  python manage.py <command>
        """)
        return
    
    command = sys.argv[1]
    
    if command == 'test':
        run_tests()
    elif command == 'migrate':
        migrate_database()
    elif command == 'collectstatic':
        collect_static()
    elif command == 'check':
        check_deployment()
    elif command == 'createsuperuser':
        create_superuser()
    elif command == 'loaddata':
        load_fixtures()
    elif command == 'showurls':
        show_urls()
    elif command in ['runserver', 'shell', 'makemigrations', 'dbshell']:
        # 对于标准Django命令，直接传递给Django
        configure_django()
        execute_from_command_line(sys.argv)
    else:
        print(f"❌ 未知命令: {command}")
        print("使用 'python manage.py' 查看可用命令")
        sys.exit(1)


if __name__ == '__main__':
    main()