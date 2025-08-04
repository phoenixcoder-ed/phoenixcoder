from fastapi import APIRouter
from .auth import router as auth_router
from .user_management import router as user_management_router
from .interview_questions import router as interview_questions_router
from .knowledge_base import router as knowledge_base_router

router = APIRouter()
router.include_router(auth_router, tags=["auth"])
router.include_router(user_management_router, tags=["user_management"])
router.include_router(interview_questions_router, tags=["interview_questions"])
router.include_router(knowledge_base_router, tags=["knowledge_base"])