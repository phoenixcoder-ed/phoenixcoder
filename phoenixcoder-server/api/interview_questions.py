from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi.security import OAuth2AuthorizationCodeBearer
from config.settings import settings

router = APIRouter()
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{settings.OIDC_ISSUER}/authorize",
    tokenUrl=f"{settings.OIDC_ISSUER}/token"
)

# 定义题目模型
class QuestionModel(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str  # single_choice, multiple_choice, true_false, essay
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    difficulty: str  # easy, medium, hard
    category: str
    created_at: str
    updated_at: str

# 定义创建题目请求模型
class CreateQuestionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    difficulty: str
    category: str

# 定义更新题目请求模型
class UpdateQuestionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None

@router.get("/questions", response_model=List[QuestionModel])
async def get_questions(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    token: str = Depends(oauth2_scheme)
):
    """获取面试题库列表，支持筛选"""
    # 实际应用中应该查询数据库
    # 这里模拟获取题目列表
    questions = [
        {
            "id": "1",
            "title": "什么是RESTful API?",
            "description": "请解释RESTful API的核心原则。",
            "type": "essay",
            "difficulty": "medium",
            "category": "后端开发",
            "created_at": "2023-01-01T12:00:00Z",
            "updated_at": "2023-01-01T12:00:00Z"
        },
        {
            "id": "2",
            "title": "以下哪个不是Python的内置数据类型?",
            "options": ["list", "tuple", "array", "dict"],
            "correct_answer": "array",
            "type": "single_choice",
            "difficulty": "easy",
            "category": "Python",
            "created_at": "2023-01-02T12:00:00Z",
            "updated_at": "2023-01-02T12:00:00Z"
        },
        {
            "id": "3",
            "title": "React的生命周期包括哪些阶段?",
            "description": "请列举React组件的主要生命周期阶段。",
            "type": "essay",
            "difficulty": "hard",
            "category": "前端开发",
            "created_at": "2023-01-03T12:00:00Z",
            "updated_at": "2023-01-03T12:00:00Z"
        }
    ]

    # 应用筛选
    if category:
        questions = [q for q in questions if q["category"] == category]
    if difficulty:
        questions = [q for q in questions if q["difficulty"] == difficulty]

    # 应用分页
    questions = questions[offset:offset+limit]

    return questions

@router.get("/questions/{question_id}", response_model=QuestionModel)
async def get_question(question_id: str, token: str = Depends(oauth2_scheme)):
    """获取指定题目详情"""
    # 实际应用中应该查询数据库
    # 这里模拟获取题目
    questions = await get_questions(token=token)
    for question in questions:
        if question["id"] == question_id:
            return question
    raise HTTPException(status_code=404, detail="题目不存在")

@router.post("/questions", response_model=QuestionModel)
async def create_question(question_data: CreateQuestionRequest, token: str = Depends(oauth2_scheme)):
    """创建新题目"""
    # 实际应用中应该检查权限和保存到数据库
    # 这里模拟创建题目
    new_question = {
        "id": "4",  # 实际应用中应该自动生成
        "title": question_data.title,
        "description": question_data.description,
        "type": question_data.type,
        "options": question_data.options,
        "correct_answer": question_data.correct_answer,
        "difficulty": question_data.difficulty,
        "category": question_data.category,
        "created_at": "2023-01-04T12:00:00Z",
        "updated_at": "2023-01-04T12:00:00Z"
    }
    return new_question

@router.put("/questions/{question_id}", response_model=QuestionModel)
async def update_question(question_id: str, question_data: UpdateQuestionRequest, token: str = Depends(oauth2_scheme)):
    """更新题目信息"""
    # 实际应用中应该查询并更新数据库
    # 这里模拟更新题目
    questions = await get_questions(token=token)
    for question in questions:
        if question["id"] == question_id:
            if question_data.title is not None:
                question["title"] = question_data.title
            if question_data.description is not None:
                question["description"] = question_data.description
            if question_data.type is not None:
                question["type"] = question_data.type
            if question_data.options is not None:
                question["options"] = question_data.options
            if question_data.correct_answer is not None:
                question["correct_answer"] = question_data.correct_answer
            if question_data.difficulty is not None:
                question["difficulty"] = question_data.difficulty
            if question_data.category is not None:
                question["category"] = question_data.category
            question["updated_at"] = "2023-01-05T12:00:00Z"
            return question
    raise HTTPException(status_code=404, detail="题目不存在")

@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, token: str = Depends(oauth2_scheme)):
    """删除题目"""
    # 实际应用中应该查询并删除数据库中的题目
    # 这里模拟删除题目
    return {"message": "题目删除成功"}