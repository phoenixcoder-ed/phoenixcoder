from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import (
    Question, AnswerRecord, StudyProgress,
    QuestionType, DifficultyLevel, AnswerResult, ProgrammingLanguage
)
from repositories.question_repository import QuestionRepository
from repositories.answer_record_repository import AnswerRecordRepository
from repositories.study_progress_repository import StudyProgressRepository
from services.question_service import QuestionService
from database.connection import get_session
from auth.dependencies import get_current_user

router = APIRouter()

# 定义题目响应模型
class QuestionResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    type: str
    difficulty: str
    category: str
    tags: Optional[List[str]] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    input_example: Optional[str] = None
    output_example: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = None
    time_limit: Optional[int] = None
    memory_limit: Optional[int] = None
    is_active: bool
    is_public: bool
    view_count: int
    attempt_count: int
    pass_count: int
    created_by: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# 定义创建题目请求模型
class CreateQuestionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="题目标题")
    description: Optional[str] = Field(None, description="题目描述")
    content: Optional[str] = Field(None, description="题目详细内容")
    type: str = Field(..., description="题目类型")
    difficulty: str = Field(..., description="难度级别")
    category: str = Field(..., min_length=1, max_length=100, description="题目分类")
    tags: Optional[List[str]] = Field(default_factory=list, description="题目标签")
    options: Optional[List[str]] = Field(None, description="选择题选项")
    correct_answer: Optional[str] = Field(None, description="正确答案")
    input_example: Optional[str] = Field(None, description="输入示例")
    output_example: Optional[str] = Field(None, description="输出示例")
    test_cases: Optional[List[Dict[str, Any]]] = Field(None, description="测试用例")
    time_limit: Optional[int] = Field(None, ge=1, description="时间限制(ms)")
    memory_limit: Optional[int] = Field(None, ge=1, description="内存限制(KB)")

# 定义更新题目请求模型
class UpdateQuestionRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="题目标题")
    description: Optional[str] = Field(None, description="题目描述")
    content: Optional[str] = Field(None, description="题目详细内容")
    type: Optional[str] = Field(None, description="题目类型")
    difficulty: Optional[str] = Field(None, description="难度级别")
    category: Optional[str] = Field(None, min_length=1, max_length=100, description="题目分类")
    tags: Optional[List[str]] = Field(None, description="题目标签")
    options: Optional[List[str]] = Field(None, description="选择题选项")
    correct_answer: Optional[str] = Field(None, description="正确答案")
    input_example: Optional[str] = Field(None, description="输入示例")
    output_example: Optional[str] = Field(None, description="输出示例")
    test_cases: Optional[List[Dict[str, Any]]] = Field(None, description="测试用例")
    time_limit: Optional[int] = Field(None, ge=1, description="时间限制(ms)")
    memory_limit: Optional[int] = Field(None, ge=1, description="内存限制(KB)")
    is_active: Optional[bool] = Field(None, description="是否启用")
    is_public: Optional[bool] = Field(None, description="是否公开")

# 定义提交答案请求模型
class SubmitAnswerRequest(BaseModel):
    answer_content: Optional[str] = Field(None, description="答题内容")
    code: Optional[str] = Field(None, description="代码")
    language: Optional[str] = Field(None, description="编程语言")
    start_time: Optional[str] = Field(None, description="开始时间")
    time_spent: Optional[int] = Field(None, ge=0, description="答题耗时(秒)")
    test_cases_passed: Optional[int] = Field(None, ge=0, description="通过的测试用例数")
    total_test_cases: Optional[int] = Field(None, ge=0, description="总测试用例数")
    execution_time: Optional[int] = Field(None, ge=0, description="执行时间(ms)")
    memory_used: Optional[int] = Field(None, ge=0, description="内存占用(KB)")
    error_message: Optional[str] = Field(None, description="错误信息")
    compile_error: Optional[str] = Field(None, description="编译错误")
    hints_used: Optional[int] = Field(default=0, ge=0, description="使用提示次数")

# 定义答题记录响应模型
class AnswerRecordResponse(BaseModel):
    id: str
    user_id: str
    question_id: str
    answer_content: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None
    result: str
    score: float
    is_correct: bool
    test_cases_passed: int
    total_test_cases: int
    execution_time: Optional[int] = None
    memory_used: Optional[int] = None
    error_message: Optional[str] = None
    compile_error: Optional[str] = None
    hints_used: int
    start_time: Optional[str] = None
    submit_time: str
    time_spent: Optional[int] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# 定义分页响应模型
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    skip: int
    limit: int

# 依赖注入
async def get_question_service(session: AsyncSession = Depends(get_session)) -> QuestionService:
    """获取题目服务实例"""
    question_repo = QuestionRepository(session)
    answer_record_repo = AnswerRecordRepository(session)
    study_progress_repo = StudyProgressRepository(session)
    return QuestionService(question_repo, answer_record_repo, study_progress_repo)

@router.get("/questions", response_model=PaginatedResponse)
async def get_questions(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    question_service: QuestionService = Depends(get_question_service)
):
    """获取题目列表"""
    try:
        # 构建筛选条件
        filters = {}
        if category:
            filters['category'] = category
        if difficulty:
            filters['difficulty'] = difficulty
        if type:
            filters['type'] = type
        if search:
            filters['search'] = search
        
        result = await question_service.list_questions(
            skip=skip, 
            limit=limit, 
            filters=filters
        )
        questions = result['items']
        total = result['total']
        
        return PaginatedResponse(
            items=[QuestionResponse.model_validate(q) for q in questions],
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取题目列表失败: {str(e)}")

@router.get("/questions/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    question_service: QuestionService = Depends(get_question_service)
):
    """获取单个题目详情"""
    try:
        question = await question_service.get_question(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="题目不存在")
        
        return QuestionResponse.model_validate(question)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取题目详情失败: {str(e)}")

@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: CreateQuestionRequest,
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """创建新题目"""
    try:
        # 验证题目类型
        if question.type not in [t.value for t in QuestionType]:
            raise HTTPException(status_code=400, detail="无效的题目类型")
        
        # 验证难度级别
        if question.difficulty not in [d.value for d in DifficultyLevel]:
            raise HTTPException(status_code=400, detail="无效的难度级别")
        
        # 验证选择题选项
        if question.type in [QuestionType.SINGLE_CHOICE.value, QuestionType.MULTIPLE_CHOICE.value]:
            if not question.options or len(question.options) < 2:
                raise HTTPException(status_code=400, detail="选择题至少需要2个选项")
        
        created_question = await question_service.create_question(
            question.model_dump()
        )
        
        return QuestionResponse.model_validate(created_question)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建题目失败: {str(e)}")

@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question: UpdateQuestionRequest,
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """更新题目"""
    try:
        # 检查题目是否存在
        existing_question = await question_service.get_question(question_id)
        if not existing_question:
            raise HTTPException(status_code=404, detail="题目不存在")
        
        # 验证题目类型
        if question.type and question.type not in [t.value for t in QuestionType]:
            raise HTTPException(status_code=400, detail="无效的题目类型")
        
        # 验证难度级别
        if question.difficulty and question.difficulty not in [d.value for d in DifficultyLevel]:
            raise HTTPException(status_code=400, detail="无效的难度级别")
        
        updated_question = await question_service.update_question(
            question_id,
            question.model_dump(exclude_unset=True)
        )
        
        return QuestionResponse.model_validate(updated_question)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新题目失败: {str(e)}")

@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """删除题目"""
    try:
        # 检查题目是否存在
        existing_question = await question_service.get_question(question_id)
        if not existing_question:
            raise HTTPException(status_code=404, detail="题目不存在")
        
        await question_service.delete_question(question_id)
        return {"message": "删除题目成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除题目失败: {str(e)}")

@router.post("/questions/{question_id}/submit", response_model=AnswerRecordResponse)
async def submit_answer(
    question_id: str,
    answer: SubmitAnswerRequest,
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """提交答案"""
    try:
        # 检查题目是否存在
        question = await question_service.get_question(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="题目不存在")
        
        # 验证编程语言
        if answer.language and answer.language not in [l.value for l in ProgrammingLanguage]:
            raise HTTPException(status_code=400, detail="不支持的编程语言")
        
        answer_record = await question_service.submit_answer(
            user_id=current_user.get("id"),
            question_id=question_id,
            answer_data=answer.model_dump()
        )
        
        return AnswerRecordResponse.model_validate(answer_record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提交答案失败: {str(e)}")

@router.get("/questions/random", response_model=QuestionResponse)
async def get_random_question(
    category: Optional[str] = Query(None, description="题目分类"),
    difficulty: Optional[str] = Query(None, description="难度级别"),
    type: Optional[str] = Query(None, description="题目类型"),
    question_service: QuestionService = Depends(get_question_service)
):
    """获取随机题目"""
    try:
        filters = {}
        if category:
            filters['category'] = category
        if difficulty:
            filters['difficulty'] = difficulty
        if type:
            filters['type'] = type
        
        questions = await question_service.get_random_questions(count=1, filters=filters)
        question = questions[0] if questions else None
        if not question:
            raise HTTPException(status_code=404, detail="没有找到符合条件的题目")
        
        return QuestionResponse.model_validate(question)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取随机题目失败: {str(e)}")

@router.get("/categories")
async def get_categories(
    question_service: QuestionService = Depends(get_question_service)
):
    """获取所有题目分类"""
    try:
        categories = await question_service.get_categories()
        return {"data": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分类失败: {str(e)}")

@router.get("/statistics")
async def get_statistics(
    question_service: QuestionService = Depends(get_question_service)
):
    """获取题目统计信息"""
    try:
        stats = await question_service.get_statistics()
        return {"data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

@router.get("/user/records", response_model=PaginatedResponse)
async def get_user_answer_records(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    question_id: Optional[str] = Query(None, description="题目ID"),
    result: Optional[str] = Query(None, description="答题结果"),
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """获取用户答题记录"""
    try:
        filters = {"user_id": current_user.get("id")}
        if question_id:
            filters['question_id'] = question_id
        if result:
            filters['result'] = result
        
        result = await question_service.get_user_answer_records(
            user_id=current_user.get("id"),
            skip=skip,
            limit=limit
        )
        records = result['items']
        total = result['total']
        
        return PaginatedResponse(
            items=[AnswerRecordResponse.model_validate(r) for r in records],
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取答题记录失败: {str(e)}")

@router.get("/user/wrong-questions", response_model=PaginatedResponse)
async def get_user_wrong_questions(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """获取用户错题集"""
    try:
        result = await question_service.get_user_wrong_answers(
            user_id=current_user.get("id"),
            skip=skip,
            limit=limit
        )
        wrong_answers = result['items']
        total = result['total']
        
        return PaginatedResponse(
            items=[AnswerRecordResponse.model_validate(r) for r in wrong_answers],
            total=total,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取错题集失败: {str(e)}")

@router.get("/user/statistics")
async def get_user_statistics(
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """获取用户答题统计"""
    try:
        stats = await question_service.get_user_statistics(current_user.get("id"))
        return {"data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户统计失败: {str(e)}")

@router.get("/user/progress")
async def get_user_progress(
    current_user: dict = Depends(get_current_user),
    question_service: QuestionService = Depends(get_question_service)
):
    """获取用户学习进度"""
    try:
        progress = await question_service.get_user_study_progress(current_user.get("id"))
        return {"data": progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取学习进度失败: {str(e)}")