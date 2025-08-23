"""
任务服务单元测试
测试 TaskService 的核心业务逻辑
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
from services.task_service import (
    TaskService, TaskCreateData, TaskUpdateData, TaskSearchFilters,
    TaskApplication, TaskStats
)
from database.models.task import Task, TaskStatus, TaskPriority, TaskType
from database.models.user import User, UserType
from repositories.task_repository import TaskRepository
from repositories.user_repository import UserRepository
from shared.exceptions import (
    TaskNotFoundError, ValidationError, PermissionDeniedError,
    BusinessLogicError
)


class TestTaskService:
    """任务服务测试类"""

    @pytest.fixture
    def mock_task_repo(self):
        """模拟任务仓库"""
        return AsyncMock(spec=TaskRepository)

    @pytest.fixture
    def mock_user_repo(self):
        """模拟用户仓库"""
        return AsyncMock(spec=UserRepository)

    @pytest.fixture
    def task_service(self, mock_task_repo, mock_user_repo):
        """任务服务实例"""
        return TaskService(mock_task_repo, mock_user_repo)

    @pytest.fixture
    def sample_employer(self):
        """示例雇主用户"""
        return User(
            id="employer_123",
            username="employer",
            email="employer@test.com",
            user_type=UserType.EMPLOYER,
            is_active=True
        )

    @pytest.fixture
    def sample_developer(self):
        """示例开发者用户"""
        return User(
            id="dev_123",
            username="developer",
            email="dev@test.com",
            user_type=UserType.DEVELOPER,
            is_active=True
        )

    @pytest.fixture
    def sample_admin(self):
        """示例管理员用户"""
        return User(
            id="admin_123",
            username="admin",
            email="admin@test.com",
            user_type=UserType.ADMIN,
            is_active=True
        )

    @pytest.fixture
    def sample_task_data(self):
        """示例任务创建数据"""
        return TaskCreateData(
            title="开发Web应用",
            description="需要开发一个现代化的Web应用程序",
            task_type=TaskType.DEVELOPMENT,
            priority=TaskPriority.HIGH,
            budget_min=5000.0,
            budget_max=10000.0,
            deadline=datetime.utcnow() + timedelta(days=30),
            required_skills=["Python", "React", "PostgreSQL"],
            estimated_hours=160,
            tags=["web", "fullstack"]
        )

    @pytest.fixture
    def sample_task(self):
        """示例任务"""
        return Task(
            id="task_123",
            title="开发Web应用",
            description="需要开发一个现代化的Web应用程序",
            task_type=TaskType.DEVELOPMENT,
            priority=TaskPriority.HIGH,
            status=TaskStatus.OPEN,
            budget_min=5000.0,
            budget_max=10000.0,
            deadline=datetime.utcnow() + timedelta(days=30),
            required_skills=["Python", "React", "PostgreSQL"],
            estimated_hours=160,
            tags=["web", "fullstack"],
            employer_id="employer_123",
            created_at=datetime.utcnow()
        )

    @pytest.fixture
    def sample_application(self):
        """示例任务申请"""
        return TaskApplication(
            id="app_123",
            task_id="task_123",
            applicant_id="dev_123",
            applicant_name="开发者",
            applicant_avatar=None,
            cover_letter="我有丰富的Web开发经验",
            proposed_budget=8000.0,
            estimated_completion=datetime.utcnow() + timedelta(days=25),
            portfolio_links=["https://github.com/dev"],
            status="pending",
            applied_at=datetime.utcnow()
        )


class TestCreateTask:
    """测试创建任务"""

    @pytest.mark.asyncio
    async def test_create_task_success(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_employer, sample_task_data, sample_task
    ):
        """测试成功创建任务"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_employer
        mock_task_repo.create_task.return_value = sample_task

        # 执行测试
        result = await task_service.create_task(sample_task_data, "employer_123")

        # 验证结果
        assert result == sample_task
        mock_user_repo.get_by_id.assert_called_once_with("employer_123")
        mock_task_repo.create_task.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_task_employer_not_found(
        self, task_service, mock_user_repo, sample_task_data
    ):
        """测试雇主不存在"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(ValidationError, match="雇主不存在"):
            await task_service.create_task(sample_task_data, "nonexistent")

    @pytest.mark.asyncio
    async def test_create_task_permission_denied(
        self, task_service, mock_user_repo, sample_developer, sample_task_data
    ):
        """测试非雇主用户创建任务被拒绝"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_developer

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError, match="只有雇主可以发布任务"):
            await task_service.create_task(sample_task_data, "dev_123")

    @pytest.mark.asyncio
    async def test_create_task_admin_permission(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_admin, sample_task_data, sample_task
    ):
        """测试管理员可以创建任务"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_admin
        mock_task_repo.create_task.return_value = sample_task

        # 执行测试
        result = await task_service.create_task(sample_task_data, "admin_123")

        # 验证结果
        assert result == sample_task

    @pytest.mark.asyncio
    async def test_create_task_invalid_data(
        self, task_service, mock_user_repo, sample_employer
    ):
        """测试无效任务数据"""
        # 设置模拟
        mock_user_repo.get_by_id.return_value = sample_employer

        # 测试空标题
        invalid_data = TaskCreateData(
            title="",
            description="描述",
            task_type=TaskType.DEVELOPMENT,
            priority=TaskPriority.MEDIUM
        )

        with pytest.raises(ValidationError, match="任务标题不能为空"):
            await task_service.create_task(invalid_data, "employer_123")

        # 测试过去的截止时间
        past_deadline_data = TaskCreateData(
            title="任务",
            description="描述",
            task_type=TaskType.DEVELOPMENT,
            priority=TaskPriority.MEDIUM,
            deadline=datetime.utcnow() - timedelta(days=1)
        )

        with pytest.raises(ValidationError, match="截止时间必须是未来时间"):
            await task_service.create_task(past_deadline_data, "employer_123")


class TestGetTask:
    """测试获取任务"""

    @pytest.mark.asyncio
    async def test_get_task_success(
        self, task_service, mock_task_repo, sample_task
    ):
        """测试成功获取任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task

        # 执行测试
        result = await task_service.get_task("task_123")

        # 验证结果
        assert result == sample_task
        mock_task_repo.get_by_id.assert_called_once_with("task_123")

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, task_service, mock_task_repo):
        """测试任务不存在"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(TaskNotFoundError, match="任务不存在: task_123"):
            await task_service.get_task("task_123")

    @pytest.mark.asyncio
    async def test_get_draft_task_permission(self, task_service, mock_task_repo):
        """测试草稿任务访问权限"""
        # 设置模拟
        draft_task = Mock()
        draft_task.status = TaskStatus.DRAFT
        draft_task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = draft_task

        # 测试雇主可以访问
        result = await task_service.get_task("task_123", "employer_123")
        assert result == draft_task

        # 测试其他用户不能访问
        with pytest.raises(PermissionDeniedError, match="无权限查看此任务"):
            await task_service.get_task("task_123", "other_user")


class TestUpdateTask:
    """测试更新任务"""

    @pytest.mark.asyncio
    async def test_update_task_success(
        self, task_service, mock_task_repo, sample_task
    ):
        """测试成功更新任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        updated_task = Mock()
        mock_task_repo.update_task.return_value = updated_task

        update_data = TaskUpdateData(title="更新的标题")

        # 执行测试
        result = await task_service.update_task("task_123", update_data, "employer_123")

        # 验证结果
        assert result == updated_task
        mock_task_repo.update_task.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_task_permission_denied(
        self, task_service, mock_task_repo, mock_user_repo, sample_task, sample_developer
    ):
        """测试无权限更新任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_user_repo.get_by_id.return_value = sample_developer

        update_data = TaskUpdateData(title="更新的标题")

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError, match="无权限更新此任务"):
            await task_service.update_task("task_123", update_data, "dev_123")

    @pytest.mark.asyncio
    async def test_update_completed_task(self, task_service, mock_task_repo):
        """测试更新已完成任务"""
        # 设置模拟
        completed_task = Mock()
        completed_task.status = TaskStatus.COMPLETED
        completed_task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = completed_task

        update_data = TaskUpdateData(title="更新的标题")

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="已完成或已取消的任务不能更新"):
            await task_service.update_task("task_123", update_data, "employer_123")


class TestDeleteTask:
    """测试删除任务"""

    @pytest.mark.asyncio
    async def test_delete_task_success(
        self, task_service, mock_task_repo, sample_task
    ):
        """测试成功删除任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.soft_delete_task.return_value = True

        # 执行测试
        result = await task_service.delete_task("task_123", "employer_123")

        # 验证结果
        assert result is True
        mock_task_repo.soft_delete_task.assert_called_once_with("task_123")

    @pytest.mark.asyncio
    async def test_delete_in_progress_task(self, task_service, mock_task_repo):
        """测试删除进行中任务"""
        # 设置模拟
        in_progress_task = Mock()
        in_progress_task.status = TaskStatus.IN_PROGRESS
        in_progress_task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = in_progress_task

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="进行中的任务不能删除"):
            await task_service.delete_task("task_123", "employer_123")


class TestSearchTasks:
    """测试搜索任务"""

    @pytest.mark.asyncio
    async def test_search_tasks_success(self, task_service, mock_task_repo):
        """测试成功搜索任务"""
        # 设置模拟
        tasks = [Mock(), Mock()]
        mock_task_repo.search_tasks.return_value = (tasks, 2)

        filters = TaskSearchFilters(
            status=TaskStatus.OPEN,
            task_type=TaskType.DEVELOPMENT
        )

        # 执行测试
        result = await task_service.search_tasks(filters, page=1, page_size=10)

        # 验证结果
        assert result["tasks"] == tasks
        assert result["total"] == 2
        assert result["page"] == 1
        assert result["page_size"] == 10
        assert result["total_pages"] == 1

    @pytest.mark.asyncio
    async def test_search_tasks_pagination(self, task_service, mock_task_repo):
        """测试搜索任务分页"""
        # 设置模拟
        tasks = [Mock() for _ in range(5)]
        mock_task_repo.search_tasks.return_value = (tasks, 25)

        filters = TaskSearchFilters()

        # 执行测试
        result = await task_service.search_tasks(filters, page=2, page_size=10)

        # 验证结果
        assert result["total_pages"] == 3
        assert result["page"] == 2


class TestApplyForTask:
    """测试申请任务"""

    @pytest.mark.asyncio
    async def test_apply_for_task_success(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_task, sample_developer, sample_application
    ):
        """测试成功申请任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_user_repo.get_by_id.return_value = sample_developer
        mock_task_repo.get_application.return_value = None
        mock_task_repo.create_application.return_value = sample_application

        # 执行测试
        result = await task_service.apply_for_task(
            "task_123", "dev_123", "我有丰富的经验", 8000.0
        )

        # 验证结果
        assert result == sample_application
        mock_task_repo.create_application.assert_called_once()

    @pytest.mark.asyncio
    async def test_apply_for_task_not_found(
        self, task_service, mock_task_repo
    ):
        """测试申请不存在的任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = None

        # 执行测试并验证异常
        with pytest.raises(TaskNotFoundError, match="任务不存在"):
            await task_service.apply_for_task(
                "task_123", "dev_123", "求职信"
            )

    @pytest.mark.asyncio
    async def test_apply_for_task_permission_denied(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_task, sample_employer
    ):
        """测试雇主申请任务被拒绝"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_user_repo.get_by_id.return_value = sample_employer

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError, match="只有开发者可以申请任务"):
            await task_service.apply_for_task(
                "task_123", "employer_123", "求职信"
            )

    @pytest.mark.asyncio
    async def test_apply_for_closed_task(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_developer
    ):
        """测试申请已关闭任务"""
        # 设置模拟
        closed_task = Mock()
        closed_task.status = TaskStatus.COMPLETED
        mock_task_repo.get_by_id.return_value = closed_task
        mock_user_repo.get_by_id.return_value = sample_developer

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="只能申请开放状态的任务"):
            await task_service.apply_for_task(
                "task_123", "dev_123", "求职信"
            )

    @pytest.mark.asyncio
    async def test_apply_for_task_already_applied(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_task, sample_developer, sample_application
    ):
        """测试重复申请任务"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_user_repo.get_by_id.return_value = sample_developer
        mock_task_repo.get_application.return_value = sample_application

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="已经申请过此任务"):
            await task_service.apply_for_task(
                "task_123", "dev_123", "求职信"
            )

    @pytest.mark.asyncio
    async def test_apply_for_task_invalid_data(
        self, task_service, mock_task_repo, mock_user_repo,
        sample_task, sample_developer
    ):
        """测试无效申请数据"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_user_repo.get_by_id.return_value = sample_developer
        mock_task_repo.get_application.return_value = None

        # 测试空求职信
        with pytest.raises(ValidationError, match="求职信不能为空"):
            await task_service.apply_for_task(
                "task_123", "dev_123", ""
            )

        # 测试无效报价
        with pytest.raises(ValidationError, match="报价必须大于0"):
            await task_service.apply_for_task(
                "task_123", "dev_123", "求职信", -100.0
            )


class TestTaskApplications:
    """测试任务申请管理"""

    @pytest.mark.asyncio
    async def test_get_task_applications_success(
        self, task_service, mock_task_repo, sample_task, sample_application
    ):
        """测试成功获取任务申请列表"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.get_task_applications.return_value = [sample_application]

        # 执行测试
        result = await task_service.get_task_applications("task_123", "employer_123")

        # 验证结果
        assert result == [sample_application]
        mock_task_repo.get_task_applications.assert_called_once_with("task_123")

    @pytest.mark.asyncio
    async def test_accept_application_success(
        self, task_service, mock_task_repo, sample_task, sample_application
    ):
        """测试成功接受申请"""
        # 设置模拟
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.get_application_by_id.return_value = sample_application
        mock_task_repo.accept_application.return_value = True

        # 执行测试
        result = await task_service.accept_application(
            "task_123", "app_123", "employer_123"
        )

        # 验证结果
        assert result is True
        mock_task_repo.accept_application.assert_called_once()

    @pytest.mark.asyncio
    async def test_reject_application_success(
        self, task_service, mock_task_repo, sample_application
    ):
        """测试成功拒绝申请"""
        # 设置模拟
        task = Mock()
        task.employer_id = "employer_123"
        mock_task_repo.get_application_by_id.return_value = sample_application
        mock_task_repo.get_by_id.return_value = task
        mock_task_repo.reject_application.return_value = True

        # 执行测试
        result = await task_service.reject_application(
            "app_123", "employer_123", "不符合要求"
        )

        # 验证结果
        assert result is True
        mock_task_repo.reject_application.assert_called_once_with(
            "app_123", "不符合要求"
        )


class TestTaskCompletion:
    """测试任务完成"""

    @pytest.mark.asyncio
    async def test_complete_task_success(
        self, task_service, mock_task_repo
    ):
        """测试成功完成任务"""
        # 设置模拟
        task = Mock()
        task.status = TaskStatus.IN_PROGRESS
        task.assignee_id = "dev_123"
        task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = task
        mock_task_repo.complete_task.return_value = True

        # 执行测试（任务执行者完成）
        result = await task_service.complete_task("task_123", "dev_123", "任务完成")

        # 验证结果
        assert result is True
        mock_task_repo.complete_task.assert_called_once_with("task_123", "任务完成")

    @pytest.mark.asyncio
    async def test_complete_task_by_employer(
        self, task_service, mock_task_repo
    ):
        """测试雇主完成任务"""
        # 设置模拟
        task = Mock()
        task.status = TaskStatus.IN_PROGRESS
        task.assignee_id = "dev_123"
        task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = task
        mock_task_repo.complete_task.return_value = True

        # 执行测试（雇主完成）
        result = await task_service.complete_task("task_123", "employer_123")

        # 验证结果
        assert result is True

    @pytest.mark.asyncio
    async def test_complete_task_permission_denied(
        self, task_service, mock_task_repo
    ):
        """测试无权限完成任务"""
        # 设置模拟
        task = Mock()
        task.status = TaskStatus.IN_PROGRESS
        task.assignee_id = "dev_123"
        task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = task

        # 执行测试并验证异常
        with pytest.raises(PermissionDeniedError, match="无权限完成此任务"):
            await task_service.complete_task("task_123", "other_user")

    @pytest.mark.asyncio
    async def test_complete_task_invalid_status(
        self, task_service, mock_task_repo
    ):
        """测试完成非进行中任务"""
        # 设置模拟
        task = Mock()
        task.status = TaskStatus.OPEN
        task.assignee_id = "dev_123"
        task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = task

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="只能完成进行中的任务"):
            await task_service.complete_task("task_123", "dev_123")


class TestTaskCancellation:
    """测试任务取消"""

    @pytest.mark.asyncio
    async def test_cancel_task_success(
        self, task_service, mock_task_repo
    ):
        """测试成功取消任务"""
        # 设置模拟
        task = Mock()
        task.status = TaskStatus.OPEN
        task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = task
        mock_task_repo.cancel_task.return_value = True

        # 执行测试
        result = await task_service.cancel_task("task_123", "employer_123", "需求变更")

        # 验证结果
        assert result is True
        mock_task_repo.cancel_task.assert_called_once_with("task_123", "需求变更")

    @pytest.mark.asyncio
    async def test_cancel_completed_task(
        self, task_service, mock_task_repo
    ):
        """测试取消已完成任务"""
        # 设置模拟
        task = Mock()
        task.status = TaskStatus.COMPLETED
        task.employer_id = "employer_123"
        mock_task_repo.get_by_id.return_value = task

        # 执行测试并验证异常
        with pytest.raises(BusinessLogicError, match="已完成或已取消的任务不能再次取消"):
            await task_service.cancel_task("task_123", "employer_123")


class TestTaskStats:
    """测试任务统计"""

    @pytest.mark.asyncio
    async def test_get_task_stats(self, task_service, mock_task_repo):
        """测试获取任务统计"""
        # 设置模拟
        stats_data = {
            "total_tasks": 100,
            "active_tasks": 25,
            "completed_tasks": 60,
            "cancelled_tasks": 15,
            "tasks_today": 5,
            "tasks_this_week": 20,
            "tasks_this_month": 80,
            "average_budget": 7500.0,
            "total_budget": 750000.0
        }
        mock_task_repo.get_task_statistics.return_value = stats_data

        # 执行测试
        result = await task_service.get_task_stats("user_123")

        # 验证结果
        assert result.total_tasks == 100
        assert result.active_tasks == 25
        assert result.completed_tasks == 60
        assert result.cancelled_tasks == 15
        assert result.tasks_today == 5
        assert result.tasks_this_week == 20
        assert result.tasks_this_month == 80
        assert result.average_budget == 7500.0
        assert result.total_budget == 750000.0


class TestTaskValidation:
    """测试任务数据验证"""

    def test_validate_title(self, task_service):
        """测试标题验证"""
        # 测试空标题
        with pytest.raises(ValidationError, match="任务标题不能为空"):
            task_service._validate_title("")

        # 测试标题过长
        with pytest.raises(ValidationError, match="任务标题不能超过200个字符"):
            task_service._validate_title("a" * 201)

    def test_validate_description(self, task_service):
        """测试描述验证"""
        # 测试空描述
        with pytest.raises(ValidationError, match="任务描述不能为空"):
            task_service._validate_description("")

        # 测试描述过长
        with pytest.raises(ValidationError, match="任务描述不能超过5000个字符"):
            task_service._validate_description("a" * 5001)

    def test_validate_budget(self, task_service):
        """测试预算验证"""
        # 测试负数预算
        with pytest.raises(ValidationError, match="最低预算不能为负数"):
            task_service._validate_budget(-100.0, 1000.0)

        with pytest.raises(ValidationError, match="最高预算不能为负数"):
            task_service._validate_budget(100.0, -1000.0)

        # 测试最低预算高于最高预算
        with pytest.raises(ValidationError, match="最低预算不能高于最高预算"):
            task_service._validate_budget(1000.0, 500.0)

    def test_build_search_conditions(self, task_service):
        """测试构建搜索条件"""
        filters = TaskSearchFilters(
            status=TaskStatus.OPEN,
            task_type=TaskType.DEVELOPMENT,
            min_budget=1000.0,
            search_text="Python"
        )

        conditions = task_service._build_search_conditions(filters)

        assert conditions["status"] == TaskStatus.OPEN
        assert conditions["task_type"] == TaskType.DEVELOPMENT
        assert conditions["min_budget"] == 1000.0
        assert conditions["search_text"] == "Python"