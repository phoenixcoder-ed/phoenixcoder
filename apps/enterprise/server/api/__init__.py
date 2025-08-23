from fastapi import APIRouter

from .auth import router as auth_router
from .user_management import router as user_management_router
from .interview_questions import router as interview_questions_router
from .knowledge_base import router as knowledge_base_router
from .growth import router as growth_router
from .placeholder import router as placeholder_router
from .validation_demo import router as validation_demo_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(user_management_router, prefix="/user", tags=["user_management"])
router.include_router(interview_questions_router, prefix="/interview", tags=["interview_questions"])
router.include_router(knowledge_base_router, prefix="/knowledge", tags=["knowledge_base"])
router.include_router(growth_router, prefix="/growth", tags=["growth"])
router.include_router(placeholder_router, prefix="/placeholder", tags=["placeholder"])
router.include_router(validation_demo_router, tags=["validation_demo"])