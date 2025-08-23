"""
技能服务单元测试
测试 SkillService 的核心业务逻辑
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入被测试的服务和相关模型
from services.skill_service import SkillService
from models.skill import (
    Skill, UserSkill, SkillAssessment, SkillCertification,
    SkillCategory, SkillLevel, SkillCreateData, UserSkillData,
    SkillSearchFilters, SkillStats
)
from models.user import User, UserType
from repositories.skill_repository import SkillRepository
from repositories.user_repository import UserRepository
from exceptions.business_exceptions import (
    ValidationError, PermissionDeniedError, SkillNotFoundError,
    BusinessLogicError
)


class TestSkillService:
    """技能服务测试类"""

    @pytest.fixture
    def mock_skill_repo(self):
        """模拟技能仓库"""
        return AsyncMock(spec=SkillRepository)

    @pytest.fixture
    def mock_user_repo(self):
        """模拟用户仓库"""
        return AsyncMock(spec=UserRepository)

    @pytest.fixture
    def skill_service(self, mock_skill_repo, mock_user_repo):
        """技能服务实例"""
        return SkillService(mock_skill_repo, mock_user_repo)

    @pytest.fixture
    def sample_admin_user(self):
        """示例管理员用户"""
        return User(
            id="admin_123",
            username="admin",
            email="admin@test.com",
            user_type=UserType.ADMIN,
            is_active=True
        )

    @pytest.fixture
    def sample_regular_user(self):
        """示例普通用户"""
        return User(
            id="user_123",
            username="testuser",
            email="user@test.com",
            user_type=UserType.DEVELOPER,
            is_active=True
        )

    @pytest.fixture
    def sample_skill_data(self):
        """示例技能创建数据"""
        return SkillCreateData(
            name="Python编程",
            description="Python编程语言技能",
            category=SkillCategory.PROGRAMMING,
            tags=["python", "backend", "web"],
            prerequisites=["基础编程概念"],
            learning_resources=["Python官方文档", "在线教程"]
        )

    @pytest.fixture
    def sample_skill(self):
        """示例技能"""
        return Skill(
            id="skill_123",
            name="Python编程",
            description="Python编程语言技能",
            category=SkillCategory.PROGRAMMING,
            tags=["python", "backend", "web"],
            prerequisites=["基础编程概念"],
            learning_resources=["Python官方文档", "在线教程"],
            creator_id="admin_123",
            created_at=datetime.utcnow()
        )

    @pytest.fixture
    def sample_user_skill_data(self):
        """示例用户技能数据"""
        return UserSkillData(
            skill_id="skill_123",
            level=SkillLevel.INTERMEDIATE,
            experience_years=2,
            certifications=["Python认证"],
            projects=["Web项目", "API项目"],
            self_assessment=7
        )

    @pytest.fixture
    def sample_user_skill(self):
        """示例用户技能"""
        return UserSkill(
            id="user_skill_123",
            user_id="user_123",
            skill_id="skill_123",
            level=SkillLevel.INTERMEDIATE,
            experience_years=2,
            certifications=["Python认证"],
            projects=["Web项目", "API项目"],
            self_assessment=7,
            created_at=datetime.utcnow()
        )


class TestCreateSkill:
    """测试创建技能"""

    @pytest.mark.asyncio
    async def test_create_skill_success(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_admin_user, sample_skill_data, sample_skill
    ):
        """测试成功创建技能"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_admin_user
        mock_skill_repo.get_by_name.return_value = None
        mock_skill_repo.create_skill.return_value = sample_skill

        # 执行测试
        result = await skill_service.create_skill(sample_skill_data, "admin_123")

        # 验证结果
        assert result == sample_skill
        mock_user_repo.get_by_id.assert_called_once_with("admin_123")
        mock_skill_repo.get_by_name.assert_called_once_with("Python编程")
        mock_skill_repo.create_skill.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_skill_permission_denied(
        self, skill_service, mock_user_repo, sample_regular_user, sample_skill_data
    ):
        """测试非管理员创建技能被拒绝"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError, match="只有管理员可以创建技能"):
            await skill_service.create_skill(sample_skill_data, "user_123")

    @pytest.mark.asyncio
    async def test_create_skill_user_not_found(
        self, skill_service, mock_user_repo, sample_skill_data
    ):
        """测试创建者不存在"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError):
            await skill_service.create_skill(sample_skill_data, "nonexistent")

    @pytest.mark.asyncio
    async def test_create_skill_name_exists(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_admin_user, sample_skill_data, sample_skill
    ):
        """测试技能名称已存在"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_admin_user
        mock_skill_repo.get_by_name.return_value = sample_skill

        # 执行测试并验证异常
        with pytest.raises(ValidationError, match="技能 'Python编程' 已存在"):
            await skill_service.create_skill(sample_skill_data, "admin_123")

    @pytest.mark.asyncio
    async def test_create_skill_invalid_data(
        self, skill_service, mock_user_repo, sample_admin_user
    ):
        """测试无效技能数据"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_admin_user

        # 测试空名称
        invalid_data = SkillCreateData(
            name="",
            description="描述",
            category=SkillCategory.PROGRAMMING
        )

        with pytest.raises(ValidationError, match="技能名称不能为空"):
            await skill_service.create_skill(invalid_data, "admin_123")


class TestGetSkill:
    """测试获取技能"""

    @pytest.mark.asyncio
    async def test_get_skill_success(
        self, skill_service, mock_skill_repo, sample_skill
    ):
        """测试成功获取技能"""
        # 设置模拟
        mock_skill_repo.get_by_id.return_value = sample_skill

        # 执行测试
        result = await skill_service.get_skill("skill_123")

        # 验证结果
        assert result == sample_skill
        mock_skill_repo.get_by_id.assert_called_once_with("skill_123")

    @pytest.mark.asyncio
    async def test_get_skill_not_found(self, skill_service, mock_skill_repo):
        """测试技能不存在"""
        # 设置模拟
        mock_skill_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(SkillNotFoundError, match="技能不存在: skill_123"):
            await skill_service.get_skill("skill_123")


class TestSearchSkills:
    """测试搜索技能"""

    @pytest.mark.asyncio
    async def test_search_skills_success(self, skill_service, mock_skill_repo):
        """测试成功搜索技能"""
        # 设置模拟
        skills = [Mock(), Mock()]
        mock_skill_repo.search_skills.return_value = (skills, 2)

        filters = SkillSearchFilters(
            category=SkillCategory.PROGRAMMING,
            search_text="Python"
        )

        # 执行测试
        result = await skill_service.search_skills(filters, page=1, page_size=10)

        # 验证结果
        assert result["skills"] == skills
        assert result["total"] == 2
        assert result["page"] == 1
        assert result["page_size"] == 10
        assert result["total_pages"] == 1

    @pytest.mark.asyncio
    async def test_search_skills_pagination(self, skill_service, mock_skill_repo):
        """测试搜索技能分页"""
        # 设置模拟
        skills = [Mock() for _ in range(5)]
        mock_skill_repo.search_skills.return_value = (skills, 25)

        filters = SkillSearchFilters()

        # 执行测试
        result = await skill_service.search_skills(filters, page=2, page_size=10)

        # 验证结果
        assert result["total_pages"] == 3
        assert result["page"] == 2


class TestAddUserSkill:
    """测试添加用户技能"""

    @pytest.mark.asyncio
    async def test_add_user_skill_success(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_regular_user, sample_skill, sample_user_skill_data, sample_user_skill
    ):
        """测试成功添加用户技能"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user
        mock_skill_repo.get_by_id.return_value = sample_skill
        mock_skill_repo.get_user_skill.return_value = None
        mock_skill_repo.add_user_skill.return_value = sample_user_skill

        # 执行测试
        result = await skill_service.add_user_skill("user_123", sample_user_skill_data)

        # 验证结果
        assert result == sample_user_skill
        mock_skill_repo.add_user_skill.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_user_skill_user_not_found(
        self, skill_service, mock_user_repo, sample_user_skill_data
    ):
        """测试用户不存在"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(ValidationError, match="用户不存在"):
            await skill_service.add_user_skill("user_123", sample_user_skill_data)

    @pytest.mark.asyncio
    async def test_add_user_skill_skill_not_found(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_regular_user, sample_user_skill_data
    ):
        """测试技能不存在"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user
        mock_skill_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(SkillNotFoundError, match="技能不存在"):
            await skill_service.add_user_skill("user_123", sample_user_skill_data)

    @pytest.mark.asyncio
    async def test_add_user_skill_already_exists(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_regular_user, sample_skill, sample_user_skill_data, sample_user_skill
    ):
        """测试用户已拥有此技能"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user
        mock_skill_repo.get_by_id.return_value = sample_skill
        mock_skill_repo.get_user_skill.return_value = sample_user_skill

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="用户已拥有此技能"):
            await skill_service.add_user_skill("user_123", sample_user_skill_data)


class TestUpdateUserSkill:
    """测试更新用户技能"""

    @pytest.mark.asyncio
    async def test_update_user_skill_success(
        self, skill_service, mock_skill_repo, sample_user_skill_data, sample_user_skill
    ):
        """测试成功更新用户技能"""
        # 设置模拟
        mock_skill_repo.get_user_skill.return_value = sample_user_skill
        mock_skill_repo.update_user_skill.return_value = sample_user_skill

        # 执行测试
        result = await skill_service.update_user_skill(
            "user_123", "skill_123", sample_user_skill_data, "user_123"
        )

        # 验证结果
        assert result == sample_user_skill
        mock_skill_repo.update_user_skill.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_skill_permission_denied(
        self, skill_service, mock_user_repo, sample_regular_user, sample_user_skill_data
    ):
        """测试无权限更新他人技能"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError, match="无权限更新此用户的技能"):
            await skill_service.update_user_skill(
                "user_123", "skill_123", sample_user_skill_data, "other_user"
            )

    @pytest.mark.asyncio
    async def test_update_user_skill_admin_permission(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_admin_user, sample_user_skill_data, sample_user_skill
    ):
        """测试管理员可以更新任何用户技能"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_admin_user
        mock_skill_repo.get_user_skill.return_value = sample_user_skill
        mock_skill_repo.update_user_skill.return_value = sample_user_skill

        # 执行测试
        result = await skill_service.update_user_skill(
            "user_123", "skill_123", sample_user_skill_data, "admin_123"
        )

        # 验证结果
        assert result == sample_user_skill


class TestSkillAssessment:
    """测试技能评估"""

    @pytest.mark.asyncio
    async def test_assess_skill_success(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_regular_user, sample_user_skill
    ):
        """测试成功评估技能"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user
        mock_skill_repo.get_user_skill.return_value = sample_user_skill
        
        assessment = SkillAssessment(
            id="assessment_123",
            skill_id="skill_123",
            user_id="user_123",
            assessor_id="assessor_123",
            score=85,
            level=SkillLevel.ADVANCED,
            feedback="表现优秀",
            assessment_type="peer",
            created_at=datetime.utcnow()
        )
        mock_skill_repo.create_assessment.return_value = assessment

        # 执行测试
        result = await skill_service.assess_skill(
            "user_123", "skill_123", "assessor_123", 85, "表现优秀"
        )

        # 验证结果
        assert result == assessment
        mock_skill_repo.create_assessment.assert_called_once()

    @pytest.mark.asyncio
    async def test_assess_skill_invalid_score(
        self, skill_service, mock_user_repo, sample_regular_user
    ):
        """测试无效评估分数"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_regular_user

        # 执行测试并验证异常
        with pytest.raises(ValidationError, match="评估分数必须在1-100之间"):
            await skill_service.assess_skill(
                "user_123", "skill_123", "assessor_123", 150
            )

    @pytest.mark.asyncio
    async def test_assess_skill_expert_assessment(
        self, skill_service, mock_skill_repo, mock_user_repo,
        sample_admin_user, sample_user_skill
    ):
        """测试专家评估"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_admin_user
        mock_skill_repo.get_user_skill.return_value = sample_user_skill
        
        assessment = SkillAssessment(
            id="assessment_123",
            skill_id="skill_123",
            user_id="user_123",
            assessor_id="admin_123",
            score=95,
            level=SkillLevel.EXPERT,
            assessment_type="expert",
            created_at=datetime.utcnow()
        )
        mock_skill_repo.create_assessment.return_value = assessment

        # 执行测试
        result = await skill_service.assess_skill(
            "user_123", "skill_123", "admin_123", 95
        )

        # 验证结果
        assert result.assessment_type == "expert"
        mock_skill_repo.update_user_skill_level.assert_called_once_with(
            "user_123", "skill_123", SkillLevel.EXPERT
        )


class TestSkillCertification:
    """测试技能认证"""

    @pytest.mark.asyncio
    async def test_add_certification_success(
        self, skill_service, mock_skill_repo, sample_user_skill
    ):
        """测试成功添加认证"""
        # 设置模拟
        mock_skill_repo.get_user_skill.return_value = sample_user_skill
        
        certification = SkillCertification(
            id="cert_123",
            skill_id="skill_123",
            user_id="user_123",
            certification_name="Python专业认证",
            issuer="Python协会",
            issue_date=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        mock_skill_repo.add_certification.return_value = certification

        # 执行测试
        result = await skill_service.add_certification(
            "user_123", "skill_123", "Python专业认证", "Python协会", datetime.utcnow()
        )

        # 验证结果
        assert result == certification
        mock_skill_repo.add_certification.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_certification_invalid_data(
        self, skill_service, mock_skill_repo, sample_user_skill
    ):
        """测试无效认证数据"""
        # 设置模拟
        mock_skill_repo.get_user_skill.return_value = sample_user_skill

        # 测试空认证名称
        with pytest.raises(ValidationError, match="认证名称不能为空"):
            await skill_service.add_certification(
                "user_123", "skill_123", "", "Python协会", datetime.utcnow()
            )

        # 测试未来颁发日期
        future_date = datetime.utcnow() + timedelta(days=1)
        with pytest.raises(ValidationError, match="颁发日期不能是未来时间"):
            await skill_service.add_certification(
                "user_123", "skill_123", "Python认证", "Python协会", future_date
            )


class TestSkillValidation:
    """测试技能数据验证"""

    def test_validate_skill_data(self, skill_service):
        """测试技能数据验证"""
        # 测试空名称
        with pytest.raises(ValidationError, match="技能名称不能为空"):
            skill_service._validate_skill_data(SkillCreateData(
                name="", description="描述", category=SkillCategory.PROGRAMMING
            ))

        # 测试名称过长
        with pytest.raises(ValidationError, match="技能名称不能超过100个字符"):
            skill_service._validate_skill_data(SkillCreateData(
                name="a" * 101, description="描述", category=SkillCategory.PROGRAMMING
            ))

        # 测试空描述
        with pytest.raises(ValidationError, match="技能描述不能为空"):
            skill_service._validate_skill_data(SkillCreateData(
                name="技能", description="", category=SkillCategory.PROGRAMMING
            ))

    def test_validate_user_skill_data(self, skill_service):
        """测试用户技能数据验证"""
        # 测试负数经验年限
        with pytest.raises(ValidationError, match="经验年限不能为负数"):
            skill_service._validate_user_skill_data(UserSkillData(
                skill_id="skill_123", level=SkillLevel.BEGINNER, experience_years=-1
            ))

        # 测试无效自评分数
        with pytest.raises(ValidationError, match="自评分数必须在1-10之间"):
            skill_service._validate_user_skill_data(UserSkillData(
                skill_id="skill_123", level=SkillLevel.BEGINNER, self_assessment=11
            ))

    def test_score_to_level(self, skill_service):
        """测试分数转等级"""
        assert skill_service._score_to_level(95) == SkillLevel.EXPERT
        assert skill_service._score_to_level(80) == SkillLevel.ADVANCED
        assert skill_service._score_to_level(65) == SkillLevel.INTERMEDIATE
        assert skill_service._score_to_level(45) == SkillLevel.BEGINNER
        assert skill_service._score_to_level(30) == SkillLevel.NOVICE


class TestSkillStats:
    """测试技能统计"""

    @pytest.mark.asyncio
    async def test_get_skill_stats(self, skill_service, mock_skill_repo):
        """测试获取技能统计"""
        # 设置模拟
        stats_data = {
            "total_skills": 100,
            "user_skills_count": 15,
            "certified_skills_count": 5,
            "skill_distribution": {"PROGRAMMING": 60, "DESIGN": 40},
            "level_distribution": {"INTERMEDIATE": 8, "ADVANCED": 5, "BEGINNER": 2},
            "top_skills": ["Python", "JavaScript", "React"]
        }
        mock_skill_repo.get_skill_statistics.return_value = stats_data

        # 执行测试
        result = await skill_service.get_skill_stats("user_123")

        # 验证结果
        assert result.total_skills == 100
        assert result.user_skills_count == 15
        assert result.certified_skills_count == 5
        assert result.skill_distribution == {"PROGRAMMING": 60, "DESIGN": 40}


class TestSkillRecommendations:
    """测试技能推荐"""

    @pytest.mark.asyncio
    async def test_get_skill_recommendations(
        self, skill_service, mock_skill_repo, sample_skill
    ):
        """测试获取技能推荐"""
        # 设置模拟
        user_skills = [Mock(skill_id="skill_1"), Mock(skill_id="skill_2")]
        mock_skill_repo.get_user_skills.return_value = user_skills
        mock_skill_repo.get_skill_recommendations.return_value = [sample_skill]

        # 执行测试
        result = await skill_service.get_skill_recommendations("user_123", limit=5)

        # 验证结果
        assert result == [sample_skill]
        mock_skill_repo.get_skill_recommendations.assert_called_once_with(
            user_skill_ids=["skill_1", "skill_2"],
            user_id="user_123",
            limit=5
        )

    @pytest.mark.asyncio
    async def test_get_learning_path(
        self, skill_service, mock_skill_repo, sample_skill
    ):
        """测试获取学习路径"""
        # 设置模拟
        mock_skill_repo.get_by_id.return_value = sample_skill
        user_skills = [Mock(skill_id="skill_1")]
        mock_skill_repo.get_user_skills.return_value = user_skills
        
        learning_path = {
            "target_skill": sample_skill,
            "prerequisites": ["基础编程"],
            "recommended_order": ["skill_1", "skill_123"],
            "estimated_time": "3个月"
        }
        mock_skill_repo.generate_learning_path.return_value = learning_path

        # 执行测试
        result = await skill_service.get_learning_path("skill_123", "user_123")

        # 验证结果
        assert result == learning_path
        mock_skill_repo.generate_learning_path.assert_called_once_with(
            target_skill_id="skill_123",
            user_skill_ids=["skill_1"]
        )