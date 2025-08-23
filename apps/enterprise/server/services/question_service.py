"""
题目服务层
处理题目相关的业务逻辑
"""

from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from repositories.question_repository import QuestionRepository
from repositories.answer_record_repository import AnswerRecordRepository, StudyProgressRepository
from database.models.question import Question, QuestionType, DifficultyLevel
from database.models.answer_record import AnswerRecord, AnswerResult, ProgrammingLanguage


class QuestionService:
    """题目服务"""
    
    def __init__(
        self, 
        question_repo: QuestionRepository,
        answer_record_repo: AnswerRecordRepository,
        study_progress_repo: StudyProgressRepository
    ):
        self.question_repo = question_repo
        self.answer_record_repo = answer_record_repo
        self.study_progress_repo = study_progress_repo
    
    async def create_question(self, question_data: Dict[str, Any]) -> Question:
        """创建题目"""
        question = Question(
            id=str(uuid.uuid4()),
            title=question_data["title"],
            description=question_data.get("description"),
            content=question_data.get("content"),
            type=QuestionType(question_data["type"]),
            difficulty=DifficultyLevel(question_data["difficulty"]),
            category=question_data["category"],
            tags=question_data.get("tags", []),
            options=question_data.get("options"),
            correct_answer=question_data.get("correct_answer"),
            input_example=question_data.get("input_example"),
            output_example=question_data.get("output_example"),
            test_cases=question_data.get("test_cases"),
            time_limit=question_data.get("time_limit"),
            memory_limit=question_data.get("memory_limit"),
            created_by=question_data.get("created_by")
        )
        
        return await self.question_repo.create(question)
    
    async def get_question(self, question_id: str, user_id: Optional[str] = None) -> Optional[Question]:
        """获取题目详情"""
        question = await self.question_repo.get_by_id(question_id)
        if not question:
            return None
        
        # 增加查看次数
        await self.question_repo.increment_view_count(question_id)
        
        return question
    
    async def update_question(self, question_id: str, updates: Dict[str, Any]) -> Optional[Question]:
        """更新题目"""
        # 处理枚举类型
        if "type" in updates:
            updates["type"] = QuestionType(updates["type"])
        if "difficulty" in updates:
            updates["difficulty"] = DifficultyLevel(updates["difficulty"])
        
        return await self.question_repo.update(question_id, updates)
    
    async def delete_question(self, question_id: str) -> bool:
        """删除题目"""
        return await self.question_repo.delete(question_id)
    
    async def list_questions(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """获取题目列表"""
        questions = await self.question_repo.list(skip, limit, filters)
        total = await self.question_repo.count(filters)
        
        return {
            "items": questions,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    
    async def get_random_questions(
        self, 
        count: int = 5, 
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Question]:
        """获取随机题目"""
        return await self.question_repo.get_random_questions(count, filters)
    
    async def get_categories(self) -> List[str]:
        """获取所有分类"""
        return await self.question_repo.get_categories()
    
    async def get_statistics(self) -> Dict[str, Any]:
        """获取题目统计信息"""
        return await self.question_repo.get_statistics()
    
    async def submit_answer(
        self, 
        user_id: str, 
        question_id: str, 
        answer_data: Dict[str, Any]
    ) -> AnswerRecord:
        """提交答案"""
        # 获取题目信息
        question = await self.question_repo.get_by_id(question_id)
        if not question:
            raise ValueError("题目不存在")
        
        # 增加尝试次数
        await self.question_repo.increment_attempt_count(question_id)
        
        # 评估答案
        result, score, is_correct = await self._evaluate_answer(question, answer_data)
        
        # 创建答题记录
        answer_record = AnswerRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            question_id=question_id,
            answer_content=answer_data.get("answer_content"),
            code=answer_data.get("code"),
            language=ProgrammingLanguage(answer_data["language"]) if answer_data.get("language") else None,
            result=result,
            score=score,
            is_correct=is_correct,
            test_cases_passed=answer_data.get("test_cases_passed", 0),
            total_test_cases=answer_data.get("total_test_cases", 0),
            execution_time=answer_data.get("execution_time"),
            memory_used=answer_data.get("memory_used"),
            error_message=answer_data.get("error_message"),
            compile_error=answer_data.get("compile_error"),
            hints_used=answer_data.get("hints_used", 0),
            start_time=datetime.fromisoformat(answer_data["start_time"]) if answer_data.get("start_time") else None,
            time_spent=answer_data.get("time_spent")
        )
        
        # 保存答题记录
        answer_record = await self.answer_record_repo.create(answer_record)
        
        # 如果答对了，增加通过次数
        if is_correct:
            await self.question_repo.increment_pass_count(question_id)
        
        # 更新学习进度
        await self.study_progress_repo.update_progress(
            user_id=user_id,
            category=question.category,
            is_correct=is_correct,
            difficulty=question.difficulty,
            time_spent=answer_data.get("time_spent", 0),
            score=score
        )
        
        return answer_record
    
    async def _evaluate_answer(
        self, 
        question: Question, 
        answer_data: Dict[str, Any]
    ) -> tuple[AnswerResult, float, bool]:
        """评估答案"""
        if question.type == QuestionType.CODING:
            return await self._evaluate_coding_answer(question, answer_data)
        elif question.type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE]:
            return await self._evaluate_choice_answer(question, answer_data)
        elif question.type == QuestionType.ESSAY:
            return await self._evaluate_essay_answer(question, answer_data)
        else:
            return AnswerResult.ERROR, 0.0, False
    
    async def _evaluate_coding_answer(
        self, 
        question: Question, 
        answer_data: Dict[str, Any]
    ) -> tuple[AnswerResult, float, bool]:
        """评估编程题答案"""
        # 这里应该实现代码执行和测试用例验证
        # 简化实现，基于传入的测试结果
        test_cases_passed = answer_data.get("test_cases_passed", 0)
        total_test_cases = answer_data.get("total_test_cases", 1)
        
        if answer_data.get("compile_error"):
            return AnswerResult.ERROR, 0.0, False
        
        if answer_data.get("execution_time", 0) > question.time_limit:
            return AnswerResult.TIMEOUT, 0.0, False
        
        if test_cases_passed == total_test_cases:
            return AnswerResult.PASS, 100.0, True
        elif test_cases_passed > 0:
            score = (test_cases_passed / total_test_cases) * 100
            return AnswerResult.PARTIAL, score, False
        else:
            return AnswerResult.FAIL, 0.0, False
    
    async def _evaluate_choice_answer(
        self, 
        question: Question, 
        answer_data: Dict[str, Any]
    ) -> tuple[AnswerResult, float, bool]:
        """评估选择题答案"""
        user_answer = answer_data.get("answer_content", "").strip()
        correct_answer = question.correct_answer
        
        if user_answer == correct_answer:
            return AnswerResult.PASS, 100.0, True
        else:
            return AnswerResult.FAIL, 0.0, False
    
    async def _evaluate_essay_answer(
        self, 
        question: Question, 
        answer_data: Dict[str, Any]
    ) -> tuple[AnswerResult, float, bool]:
        """评估简答题答案"""
        # 简答题需要人工评分，这里先给默认分数
        answer_content = answer_data.get("answer_content", "").strip()
        
        if len(answer_content) > 10:  # 简单的长度检查
            return AnswerResult.PASS, 80.0, True
        else:
            return AnswerResult.FAIL, 0.0, False
    
    async def get_user_answer_records(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> Dict[str, Any]:
        """获取用户答题记录"""
        records = await self.answer_record_repo.get_user_records(user_id, skip, limit)
        total = await self.answer_record_repo.count({"user_id": user_id})
        
        return {
            "items": records,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    
    async def get_user_wrong_answers(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> Dict[str, Any]:
        """获取用户错题集"""
        records = await self.answer_record_repo.get_wrong_answers(user_id, skip, limit)
        total = await self.answer_record_repo.count({"user_id": user_id, "is_correct": False})
        
        return {
            "items": records,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    
    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """获取用户答题统计"""
        return await self.answer_record_repo.get_user_statistics(user_id)
    
    async def get_user_study_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户学习进度"""
        progress_list = await self.study_progress_repo.get_user_progress(user_id)
        
        return [
            {
                "category": progress.category,
                "total_questions": progress.total_questions,
                "completed_questions": progress.completed_questions,
                "correct_questions": progress.correct_questions,
                "accuracy_rate": progress.correct_questions / progress.completed_questions if progress.completed_questions > 0 else 0.0,
                "easy_completed": progress.easy_completed,
                "medium_completed": progress.medium_completed,
                "hard_completed": progress.hard_completed,
                "total_time_spent": progress.total_time_spent,
                "average_score": progress.average_score,
                "mastery_level": progress.mastery_level,
                "last_activity_at": progress.last_activity_at.isoformat() if progress.last_activity_at else None
            }
            for progress in progress_list
        ]
    
    async def get_daily_activity(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """获取用户每日答题活动"""
        return await self.answer_record_repo.get_daily_activity(user_id, days)