#!/usr/bin/env python3
"""
刷题系统API测试脚本
使用PostgreSQL数据库，符合项目架构设计
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings import get_settings
from database.base import DatabaseManager
from database.models.question import Question, QuestionType, DifficultyLevel
from database.models.user import User, UserType, UserStatus
from database.models.answer_record import AnswerRecord, AnswerResult, ProgrammingLanguage, StudyProgress, MasteryLevel
from repositories.question_repository import QuestionRepository
from repositories.user_repository import UserRepository
from repositories.answer_record_repository import AnswerRecordRepository
from repositories.study_progress_repository import StudyProgressRepository
from services.question_service import QuestionService


async def test_question_service():
    """测试刷题服务功能"""
    # 获取配置
    settings = get_settings()
    
    # 使用测试数据库配置（与项目配置保持一致）
    test_db_url = f"postgresql+asyncpg://phoenixcoder:password@localhost:5432/phoenixcoder_test"
    
    # 创建数据库管理器
    db_manager = DatabaseManager(test_db_url)
    
    # 创建数据库表
    await db_manager.create_tables()
    
    # 清理测试数据
    async with db_manager.get_session() as session:
        from sqlalchemy import text
        # 删除测试用户相关数据
        await session.execute(text("DELETE FROM study_progress WHERE user_id = 'test_user_123'"))
        await session.execute(text("DELETE FROM answer_records WHERE user_id = 'test_user_123'"))
        await session.execute(text("DELETE FROM users WHERE id = 'test_user_123'"))
        await session.execute(text("DELETE FROM questions WHERE title = 'Python基础：变量赋值'"))
        await session.commit()
    
    # 获取数据库会话
    async with db_manager.get_session() as session:
        # 创建仓储实例
        question_repo = QuestionRepository(session)
        user_repo = UserRepository(session)
        answer_record_repo = AnswerRecordRepository(session)
        study_progress_repo = StudyProgressRepository(session)
        
        # 创建服务实例
        question_service = QuestionService(
            question_repo=question_repo,
            answer_record_repo=answer_record_repo,
            study_progress_repo=study_progress_repo
        )
        
        # 先创建一个测试用户
        test_user = User(
            id="test_user_123",
            sub="test_sub_123",
            email="test@example.com",
            name="测试用户",
            user_type=UserType.DEVELOPER,
            status=UserStatus.ACTIVE
        )
        created_user = await user_repo.create(test_user)
        print(f"创建测试用户: {created_user.name}")
        
        # 创建测试题目
        test_question = {
            "title": "Python基础：变量赋值",
            "content": "在Python中，如何给变量x赋值为10？",
            "type": QuestionType.SINGLE_CHOICE,
            "difficulty": DifficultyLevel.EASY,
            "category": "Python基础",
            "options": ["x = 10", "x := 10", "x == 10", "x -> 10"],
            "correct_answer": "x = 10",
            "explanation": "在Python中使用等号(=)进行变量赋值",
            "tags": ["Python", "变量", "基础语法"]
        }
        
        print("\n=== 测试创建题目 ===")
        question = await question_service.create_question(test_question)
        print(f"创建题目成功: {question.id} - {question.title}")
        
        print("\n=== 测试获取题目列表 ===")
        result = await question_service.list_questions()
        print(f"题目总数: {result['total']}")
        if result['items']:
            print(f"第一个题目: {result['items'][0].title}")
        
        print("\n=== 测试获取随机题目 ===")
        random_questions = await question_service.get_random_questions(count=1)
        if random_questions:
            print(f"随机题目: {random_questions[0].title}")
        
        print("\n=== 测试获取分类 ===")
        categories = await question_service.get_categories()
        print(f"分类列表: {categories}")
        
        print("\n=== 测试获取统计信息 ===")
        stats = await question_service.get_statistics()
        print(f"统计信息: {stats}")
        
        print("\n=== 测试提交答案 ===")
        answer_data = {
            "answer_content": "x = 10",
            "start_time": "2024-01-01T10:00:00",
            "time_spent": 30
        }
        answer_record = await question_service.submit_answer(
            user_id="test_user_123",
            question_id=question.id,
            answer_data=answer_data
        )
        print(f"提交答案成功: {answer_record.id} - 结果: {answer_record.result}")
        
        print("\n=== 测试获取用户答题记录 ===")
        user_records = await question_service.get_user_answer_records("test_user_123")
        print(f"用户答题记录数: {user_records['total']}")
        
        print("\n=== 测试获取用户统计 ===")
        user_stats = await question_service.get_user_statistics("test_user_123")
        print(f"用户统计: {user_stats}")
        
        print("\n=== 测试获取学习进度 ===")
        progress = await question_service.get_user_study_progress("test_user_123")
        print(f"学习进度: {len(progress)} 个分类")
        if progress:
            print(f"第一个分类进度: {progress[0]}")
    
    await db_manager.close()
    print("\n服务测试完成！")

async def main():
    """主函数"""
    await test_question_service()

if __name__ == "__main__":
    asyncio.run(main())