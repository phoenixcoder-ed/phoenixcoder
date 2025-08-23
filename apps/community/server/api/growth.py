from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from services.growth_service import GrowthService
from utils.jwt_helper import decode_jwt_token
from logging_config import logger

router = APIRouter()

# 依赖项：获取当前用户
async def get_current_user(token: str = Depends(decode_jwt_token)):
    """获取当前认证用户

    Args:
        token: JWT令牌

    Returns:
        用户信息
    """
    return token

# 定义技能模型
class SkillModel(BaseModel):
    id: str
    name: str
    category: str
    level: int
    progress: float

# 定义模块模型
class ModuleModel(BaseModel):
    id: str
    name: str
    completed: bool
    progress: Optional[float] = None

# 定义学习路径模型
class LearningPathModel(BaseModel):
    id: str
    name: str
    description: str
    progress: float
    modules: List[ModuleModel]
    skills_covered: Optional[List[str]] = None
    estimated_time: Optional[int] = None
    completed_challenges: Optional[int] = None
    total_challenges: Optional[int] = None

# 定义挑战问题模型
class ChallengeQuestionModel(BaseModel):
    id: str
    text: str
    type: str
    options: Optional[List[Dict[str, str]]] = None
    correct_answer: Optional[str] = None
    requirements: Optional[List[str]] = None
    template_code: Optional[str] = None

# 定义挑战模型
class ChallengeModel(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    skill_ids: List[str]
    completed: bool
    questions: Optional[List[ChallengeQuestionModel]] = None

@router.get("/growth/skills", response_model=List[SkillModel])
async def get_user_skills(current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取用户技能列表

    Args:
        current_user: 当前认证用户信息

    Returns:
        用户技能列表
    """
    try:
        user_id = current_user["sub"]
        skills = await GrowthService.get_user_skills(user_id)
        return skills
    except Exception as e:
        logger.error(f"获取用户技能失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户技能失败: {str(e)}"
        )

@router.get("/growth/paths", response_model=List[LearningPathModel])
async def get_user_learning_paths(current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取用户学习路径列表

    Args:
        current_user: 当前认证用户信息

    Returns:
        用户学习路径列表
    """
    try:
        user_id = current_user["sub"]
        paths = await GrowthService.get_user_learning_paths(user_id)
        return paths
    except Exception as e:
        logger.error(f"获取用户学习路径失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户学习路径失败: {str(e)}"
        )

@router.get("/growth/paths/{path_id}", response_model=LearningPathModel)
async def get_learning_path_details(path_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取学习路径详情

    Args:
        path_id: 学习路径ID
        current_user: 当前认证用户信息

    Returns:
        学习路径详情
    """
    try:
        user_id = current_user["sub"]
        path = await GrowthService.get_learning_path_details(user_id, path_id)
        if not path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="学习路径不存在"
            )
        return path
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"获取学习路径详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取学习路径详情失败: {str(e)}"
        )

@router.get("/growth/challenges", response_model=List[ChallengeModel])
async def get_user_challenges(current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取用户挑战列表

    Args:
        current_user: 当前认证用户信息

    Returns:
        用户挑战列表
    """
    try:
        user_id = current_user["sub"]
        challenges = await GrowthService.get_user_challenges(user_id)
        return challenges
    except Exception as e:
        logger.error(f"获取用户挑战列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户挑战列表失败: {str(e)}"
        )

@router.get("/growth/challenges/{challenge_id}", response_model=ChallengeModel)
async def get_challenge_details(challenge_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """获取挑战详情

    Args:
        challenge_id: 挑战ID
        current_user: 当前认证用户信息

    Returns:
        挑战详情
    """
    try:
        user_id = current_user["sub"]
        challenge = await GrowthService.get_challenge_details(user_id, challenge_id)
        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="挑战不存在"
            )
        return challenge
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"获取挑战详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取挑战详情失败: {str(e)}"
        )

# 定义完成挑战响应模型
class CompleteChallengeResponse(BaseModel):
    message: str
    skill_updates: List[Dict[str, Any]]

@router.post("/growth/challenges/{challenge_id}/complete", response_model=CompleteChallengeResponse)
async def complete_challenge(challenge_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """完成挑战

    Args:
        challenge_id: 挑战ID
        current_user: 当前认证用户信息

    Returns:
        包含消息和技能更新的响应
    """
    try:
        user_id = current_user["sub"]
        result = await GrowthService.complete_challenge(user_id, challenge_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="挑战完成失败"
            )
        return {"message": "挑战完成成功", "skill_updates": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"完成挑战失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"完成挑战失败: {str(e)}"
        )