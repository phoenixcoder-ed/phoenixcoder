#!/usr/bin/env python3
"""
测试数据库设置脚本
用于初始化和配置测试数据库
"""

import os
import sys
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path


def create_database_schema(db_path: str):
    """创建数据库表结构"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建用户表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            is_active BOOLEAN DEFAULT 1,
            is_admin BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 创建项目表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            repository_url VARCHAR(255),
            status VARCHAR(20) DEFAULT 'active',
            owner_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    """)
    
    # 创建任务表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            project_id INTEGER,
            assignee_id INTEGER,
            status VARCHAR(20) DEFAULT 'pending',
            priority VARCHAR(10) DEFAULT 'medium',
            due_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (assignee_id) REFERENCES users(id)
        )
    """)
    
    # 创建测试结果表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            test_suite VARCHAR(100),
            test_name VARCHAR(200),
            status VARCHAR(20),
            duration REAL,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
    
    # 创建性能指标表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            metric_name VARCHAR(100),
            metric_value REAL,
            unit VARCHAR(20),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"✅ 数据库表结构创建完成: {db_path}")


def insert_test_data(db_path: str):
    """插入测试数据"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 插入测试用户
    test_users = [
        ('admin', 'admin@example.com', 'hashed_password_123', 'Administrator', 1, 1),
        ('developer1', 'dev1@example.com', 'hashed_password_456', 'John Developer', 1, 0),
        ('developer2', 'dev2@example.com', 'hashed_password_789', 'Jane Coder', 1, 0),
        ('tester1', 'test1@example.com', 'hashed_password_abc', 'Bob Tester', 1, 0),
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO users (username, email, password_hash, full_name, is_active, is_admin)
        VALUES (?, ?, ?, ?, ?, ?)
    """, test_users)
    
    # 插入测试项目
    test_projects = [
        ('Phoenix Coder', 'AI-powered coding assistant platform', 'https://github.com/example/phoenixcoder', 'active', 1),
        ('Test Project Alpha', 'Sample project for testing purposes', 'https://github.com/example/test-alpha', 'active', 2),
        ('Demo Application', 'Demonstration application', 'https://github.com/example/demo-app', 'maintenance', 3),
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO projects (name, description, repository_url, status, owner_id)
        VALUES (?, ?, ?, ?, ?)
    """, test_projects)
    
    # 插入测试任务
    test_tasks = [
        ('Fix authentication bug', 'Resolve login issues in production', 1, 2, 'in_progress', 'high', '2024-01-15 10:00:00'),
        ('Implement user dashboard', 'Create user dashboard with analytics', 1, 3, 'pending', 'medium', '2024-01-20 15:30:00'),
        ('Write unit tests', 'Add comprehensive unit test coverage', 2, 4, 'completed', 'medium', '2024-01-10 09:00:00'),
        ('Update documentation', 'Update API documentation', 2, 2, 'pending', 'low', '2024-01-25 14:00:00'),
        ('Performance optimization', 'Optimize database queries', 3, 3, 'in_progress', 'high', '2024-01-18 11:00:00'),
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO tasks (title, description, project_id, assignee_id, status, priority, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, test_tasks)
    
    # 插入测试结果数据
    test_results = [
        (1, 'unit_tests', 'test_authentication', 'passed', 0.125, None),
        (1, 'unit_tests', 'test_user_creation', 'passed', 0.089, None),
        (1, 'integration_tests', 'test_api_endpoints', 'failed', 2.456, 'Connection timeout'),
        (2, 'unit_tests', 'test_data_validation', 'passed', 0.067, None),
        (2, 'e2e_tests', 'test_user_workflow', 'passed', 15.234, None),
        (3, 'unit_tests', 'test_performance', 'failed', 0.234, 'Memory leak detected'),
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO test_results (project_id, test_suite, test_name, status, duration, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
    """, test_results)
    
    # 插入性能指标数据
    base_time = datetime.now() - timedelta(days=7)
    performance_metrics = []
    
    for i in range(7):
        timestamp = base_time + timedelta(days=i)
        metrics = [
            (1, 'response_time', 120 + i * 5, 'ms', timestamp.isoformat()),
            (1, 'memory_usage', 85.5 + i * 2.1, 'MB', timestamp.isoformat()),
            (1, 'cpu_usage', 45.2 + i * 1.8, '%', timestamp.isoformat()),
            (2, 'response_time', 95 + i * 3, 'ms', timestamp.isoformat()),
            (2, 'memory_usage', 72.3 + i * 1.5, 'MB', timestamp.isoformat()),
        ]
        performance_metrics.extend(metrics)
    
    cursor.executemany("""
        INSERT OR IGNORE INTO performance_metrics (project_id, metric_name, metric_value, unit, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, performance_metrics)
    
    conn.commit()
    conn.close()
    print("✅ 测试数据插入完成")


def create_test_config(config_path: str):
    """创建测试配置文件"""
    config = {
        'database': {
            'type': 'sqlite',
            'path': 'test_database.db',
            'pool_size': 5,
            'timeout': 30
        },
        'testing': {
            'parallel': True,
            'coverage_threshold': 80,
            'test_timeout': 300,
            'fixtures': [
                'users.json',
                'projects.json',
                'tasks.json'
            ]
        },
        'logging': {
            'level': 'DEBUG',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'file': 'test.log'
        },
        'performance': {
            'max_response_time': 200,
            'max_memory_usage': 100,
            'max_cpu_usage': 80
        }
    }
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"✅ 测试配置文件创建完成: {config_path}")


def cleanup_test_data(db_path: str):
    """清理测试数据"""
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️ 测试数据库已删除: {db_path}")
    
    # 清理日志文件
    log_files = ['test.log', 'test_results.log', 'performance.log']
    for log_file in log_files:
        if os.path.exists(log_file):
            os.remove(log_file)
            print(f"🗑️ 日志文件已删除: {log_file}")


def verify_database(db_path: str):
    """验证数据库设置"""
    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 检查表是否存在
    tables = ['users', 'projects', 'tasks', 'test_results', 'performance_metrics']
    for table in tables:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
        if not cursor.fetchone():
            print(f"❌ 表不存在: {table}")
            conn.close()
            return False
    
    # 检查数据是否存在
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM projects")
    project_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tasks")
    task_count = cursor.fetchone()[0]
    
    conn.close()
    
    print(f"📊 数据库验证结果:")
    print(f"  - 用户数量: {user_count}")
    print(f"  - 项目数量: {project_count}")
    print(f"  - 任务数量: {task_count}")
    
    return user_count > 0 and project_count > 0 and task_count > 0


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("""
🗄️ 测试数据库设置脚本

可用命令:
  setup     - 设置测试数据库和数据
  cleanup   - 清理测试数据
  verify    - 验证数据库设置
  reset     - 重置数据库（清理后重新设置）

使用方法:
  python setup-test-db.py <command>
        """)
        return
    
    command = sys.argv[1]
    db_path = os.environ.get('TEST_DB_PATH', 'test_database.db')
    config_path = 'test_config.json'
    
    if command == 'setup':
        print("🚀 开始设置测试数据库...")
        
        # 创建scripts目录（如果不存在）
        scripts_dir = Path('scripts')
        scripts_dir.mkdir(exist_ok=True)
        
        create_database_schema(db_path)
        insert_test_data(db_path)
        create_test_config(config_path)
        
        if verify_database(db_path):
            print("✅ 测试数据库设置完成")
        else:
            print("❌ 测试数据库设置失败")
            sys.exit(1)
    
    elif command == 'cleanup':
        print("🧹 开始清理测试数据...")
        cleanup_test_data(db_path)
        if os.path.exists(config_path):
            os.remove(config_path)
            print(f"🗑️ 配置文件已删除: {config_path}")
        print("✅ 测试数据清理完成")
    
    elif command == 'verify':
        print("🔍 验证测试数据库...")
        if verify_database(db_path):
            print("✅ 测试数据库验证通过")
        else:
            print("❌ 测试数据库验证失败")
            sys.exit(1)
    
    elif command == 'reset':
        print("🔄 重置测试数据库...")
        cleanup_test_data(db_path)
        create_database_schema(db_path)
        insert_test_data(db_path)
        create_test_config(config_path)
        
        if verify_database(db_path):
            print("✅ 测试数据库重置完成")
        else:
            print("❌ 测试数据库重置失败")
            sys.exit(1)
    
    else:
        print(f"❌ 未知命令: {command}")
        print("使用 'python setup-test-db.py' 查看可用命令")
        sys.exit(1)


if __name__ == '__main__':
    main()