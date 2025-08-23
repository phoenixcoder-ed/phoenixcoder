#!/usr/bin/env python3
"""
刷题系统测试脚本
用于验证刷题系统的基本功能
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from database.base import init_database, Base
from database.models import Question, QuestionType, DifficultyLevel
from repositories.question_repository import QuestionRepository
from services.question_service import QuestionService
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession


async def test_interview_system():
    """测试刷题系统基本功能"""
    print("🚀 开始测试刷题系统...")
    
    try:
        # 初始化数据库（使用SQLite进行测试）
        test_db_url = "sqlite+aiosqlite:///./test_interview.db"
        
        # 创建简单的数据库引擎（避免复杂约束）
        engine = create_async_engine(test_db_url, echo=False)
        async_session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        
        # 只创建题目相关的表
        async with engine.begin() as conn:
            # 只创建题目和答题记录相关的表
            await conn.run_sync(lambda sync_conn: Base.metadata.tables['questions'].create(sync_conn, checkfirst=True))
            await conn.run_sync(lambda sync_conn: Base.metadata.tables['answer_records'].create(sync_conn, checkfirst=True))
            await conn.run_sync(lambda sync_conn: Base.metadata.tables['study_progress'].create(sync_conn, checkfirst=True))
        
        print("✅ 数据库表创建成功")
        
        # 创建一个简单的数据库管理器模拟
        class SimpleDatabaseManager:
            def __init__(self, engine, session_factory):
                self.engine = engine
                self.async_session_factory = session_factory
            
            async def get_session(self):
                return self.async_session_factory()
            
            async def close(self):
                await self.engine.dispose()
        
        db_manager = SimpleDatabaseManager(engine, async_session_factory)
        
        # 获取数据库会话
        session = await db_manager.get_session()
        
        # 初始化仓储和服务
        question_repo = QuestionRepository(session)
        question_service = QuestionService(question_repo, None, None)
        
        # 测试创建题目
        test_question = {
             "title": "Python基础：列表推导式",
             "content": "请解释Python中列表推导式的语法和用途，并给出一个实例。",
             "type": QuestionType.ESSAY,
             "difficulty": DifficultyLevel.EASY,
             "category": "Python基础",
             "tags": ["Python", "列表推导式", "基础语法"],
             "correct_answer": "列表推导式是Python中创建列表的简洁方式..."
         }
        
        created_question = await question_service.create_question(test_question)
        print(f"✅ 创建题目成功，ID: {created_question.id}")
        
        # 测试获取题目
        retrieved_question = await question_service.get_question(created_question.id)
        print(f"✅ 获取题目成功: {retrieved_question.title}")
        
        # 测试获取题目列表
        questions_result = await question_service.list_questions(skip=0, limit=10)
        print(f"✅ 获取题目列表成功，共 {questions_result['total']} 个题目")
        
        # 测试获取随机题目
        random_questions = await question_service.get_random_questions(count=1)
        if random_questions:
            print(f"✅ 获取随机题目成功: {random_questions[0].title}")
        
        # 测试获取分类
        categories = await question_service.get_categories()
        print(f"✅ 获取分类成功，共 {len(categories)} 个分类")
        
        # 测试统计信息
        stats = await question_service.get_statistics()
        print(f"✅ 获取统计信息成功: {stats}")
        
        print("🎉 刷题系统测试完成，所有功能正常！")
        
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # 清理资源
        if 'db_manager' in locals():
            await db_manager.close()
    
    return True


if __name__ == "__main__":
    # 运行测试
    success = asyncio.run(test_interview_system())
    sys.exit(0 if success else 1)