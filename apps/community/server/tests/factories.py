"""测试数据工厂

提供各种测试场景的数据生成功能，支持用户、任务、技能等实体的模拟数据创建。
"""

import factory
import factory.fuzzy
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from faker import Faker
import random
import uuid
from enum import Enum

fake = Faker('zh_CN')

# 枚举定义
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

# 基础数据工厂
class BaseFactory(factory.Factory):
    """基础工厂类"""
    
    @classmethod
    def create_batch_dict(cls, size: int, **kwargs) -> List[Dict]:
        """批量创建字典数据"""
        return [cls.build(**kwargs) for _ in range(size)]
    
    @classmethod
    def create_with_relations(cls, **kwargs) -> Dict:
        """创建带关联关系的数据"""
        return cls.build(**kwargs)

class UserFactory(BaseFactory):
    """用户数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    username = factory.LazyFunction(lambda: fake.user_name())
    email = factory.LazyFunction(lambda: fake.email())
    password_hash = factory.LazyFunction(lambda: fake.sha256())
    nickname = factory.LazyFunction(lambda: fake.name())
    avatar_url = factory.LazyFunction(lambda: fake.image_url())
    bio = factory.LazyFunction(lambda: fake.text(max_nb_chars=200))
    role = factory.fuzzy.FuzzyChoice([role.value for role in UserRole])
    is_active = factory.fuzzy.FuzzyChoice([True, False], weights=[9, 1])
    is_verified = factory.fuzzy.FuzzyChoice([True, False], weights=[7, 3])
    created_at = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-2y', end_date='now')
    )
    updated_at = factory.LazyFunction(lambda: datetime.now())
    last_login_at = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-30d', end_date='now')
    )
    
    # 扩展字段
    phone = factory.LazyFunction(lambda: fake.phone_number())
    location = factory.LazyFunction(lambda: fake.city())
    github_url = factory.LazyFunction(lambda: f"https://github.com/{fake.user_name()}")
    linkedin_url = factory.LazyFunction(lambda: f"https://linkedin.com/in/{fake.user_name()}")
    website_url = factory.LazyFunction(lambda: fake.url())
    
    @classmethod
    def create_admin(cls, **kwargs) -> Dict:
        """创建管理员用户"""
        return cls.build(role=UserRole.ADMIN.value, is_active=True, is_verified=True, **kwargs)
    
    @classmethod
    def create_developer(cls, **kwargs) -> Dict:
        """创建开发者用户"""
        skills = SkillFactory.create_batch_dict(random.randint(3, 8))
        return cls.build(
            role=UserRole.USER.value,
            is_active=True,
            is_verified=True,
            bio=f"资深开发者，擅长 {', '.join([skill['name'] for skill in skills[:3]])} 等技术",
            **kwargs
        )
    
    @classmethod
    def create_newbie(cls, **kwargs) -> Dict:
        """创建新手用户"""
        return cls.build(
            role=UserRole.USER.value,
            is_active=True,
            is_verified=False,
            bio="编程新手，正在学习中",
            created_at=fake.date_time_between(start_date='-30d', end_date='now'),
            **kwargs
        )

class SkillFactory(BaseFactory):
    """技能数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    name = factory.fuzzy.FuzzyChoice([
        'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#',
        'React', 'Vue.js', 'Angular', 'Node.js', 'Django', 'FastAPI', 'Spring Boot',
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'PostgreSQL', 'MongoDB', 'Redis',
        'Git', 'CI/CD', 'Linux', 'Nginx', 'GraphQL', 'REST API', 'Microservices',
        'Machine Learning', 'Data Science', 'DevOps', 'Frontend', 'Backend', 'Full Stack'
    ])
    description = factory.LazyFunction(lambda: fake.text(max_nb_chars=150))
    category = factory.fuzzy.FuzzyChoice([
        'programming_language', 'framework', 'database', 'tool', 'platform', 'methodology'
    ])
    level = factory.fuzzy.FuzzyChoice([level.value for level in SkillLevel])
    experience_years = factory.fuzzy.FuzzyInteger(0, 10)
    created_at = factory.LazyFunction(lambda: datetime.now())
    
    @classmethod
    def create_programming_language(cls, **kwargs) -> Dict:
        """创建编程语言技能"""
        languages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#']
        return cls.build(
            name=random.choice(languages),
            category='programming_language',
            **kwargs
        )
    
    @classmethod
    def create_framework(cls, **kwargs) -> Dict:
        """创建框架技能"""
        frameworks = ['React', 'Vue.js', 'Angular', 'Django', 'FastAPI', 'Spring Boot', 'Express.js']
        return cls.build(
            name=random.choice(frameworks),
            category='framework',
            **kwargs
        )

class TaskFactory(BaseFactory):
    """任务数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    title = factory.LazyFunction(lambda: fake.sentence(nb_words=6).rstrip('.'))
    description = factory.LazyFunction(lambda: fake.text(max_nb_chars=500))
    requirements = factory.LazyFunction(lambda: fake.text(max_nb_chars=300))
    status = factory.fuzzy.FuzzyChoice([status.value for status in TaskStatus])
    priority = factory.fuzzy.FuzzyChoice([priority.value for priority in TaskPriority])
    budget_min = factory.fuzzy.FuzzyInteger(100, 1000)
    budget_max = factory.LazyAttribute(lambda obj: obj.budget_min + random.randint(200, 2000))
    deadline = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='+1d', end_date='+90d')
    )
    created_at = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-30d', end_date='now')
    )
    updated_at = factory.LazyFunction(lambda: datetime.now())
    
    # 关联字段
    publisher_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    assignee_id = factory.LazyFunction(lambda: str(uuid.uuid4()) if random.choice([True, False]) else None)
    
    # 扩展字段
    tags = factory.LazyFunction(lambda: random.sample([
        'web开发', '移动开发', '数据分析', '机器学习', 'UI设计', '后端开发',
        '前端开发', 'DevOps', '测试', '文档编写', '代码审查', '性能优化'
    ], random.randint(1, 4)))
    
    estimated_hours = factory.fuzzy.FuzzyInteger(1, 200)
    difficulty_level = factory.fuzzy.FuzzyChoice(['easy', 'medium', 'hard', 'expert'])
    remote_allowed = factory.fuzzy.FuzzyChoice([True, False], weights=[7, 3])
    
    @classmethod
    def create_urgent_task(cls, **kwargs) -> Dict:
        """创建紧急任务"""
        return cls.build(
            priority=TaskPriority.URGENT.value,
            deadline=fake.date_time_between(start_date='+1d', end_date='+7d'),
            budget_min=500,
            budget_max=2000,
            **kwargs
        )
    
    @classmethod
    def create_long_term_task(cls, **kwargs) -> Dict:
        """创建长期任务"""
        return cls.build(
            priority=TaskPriority.MEDIUM.value,
            deadline=fake.date_time_between(start_date='+30d', end_date='+180d'),
            estimated_hours=random.randint(100, 500),
            **kwargs
        )
    
    @classmethod
    def create_completed_task(cls, **kwargs) -> Dict:
        """创建已完成任务"""
        created_time = fake.date_time_between(start_date='-90d', end_date='-30d')
        return cls.build(
            status=TaskStatus.COMPLETED.value,
            created_at=created_time,
            updated_at=created_time + timedelta(days=random.randint(1, 30)),
            assignee_id=str(uuid.uuid4()),
            **kwargs
        )

class ProjectFactory(BaseFactory):
    """项目数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    name = factory.LazyFunction(lambda: fake.company() + " " + random.choice(['平台', '系统', '应用', '工具']))
    description = factory.LazyFunction(lambda: fake.text(max_nb_chars=400))
    status = factory.fuzzy.FuzzyChoice(['planning', 'active', 'completed', 'cancelled'])
    start_date = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-180d', end_date='+30d')
    )
    end_date = factory.LazyAttribute(
        lambda obj: obj.start_date + timedelta(days=random.randint(30, 365))
    )
    budget = factory.fuzzy.FuzzyInteger(5000, 100000)
    owner_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    team_size = factory.fuzzy.FuzzyInteger(2, 15)
    
    # 技术栈
    tech_stack = factory.LazyFunction(lambda: random.sample([
        'React', 'Vue.js', 'Node.js', 'Python', 'Django', 'PostgreSQL',
        'Redis', 'Docker', 'AWS', 'TypeScript', 'GraphQL', 'MongoDB'
    ], random.randint(3, 8)))
    
    repository_url = factory.LazyFunction(lambda: f"https://github.com/{fake.user_name()}/{fake.slug()}")
    demo_url = factory.LazyFunction(lambda: fake.url())
    
    @classmethod
    def create_startup_project(cls, **kwargs) -> Dict:
        """创建创业项目"""
        return cls.build(
            status='active',
            budget=random.randint(10000, 50000),
            team_size=random.randint(2, 8),
            **kwargs
        )
    
    @classmethod
    def create_enterprise_project(cls, **kwargs) -> Dict:
        """创建企业项目"""
        return cls.build(
            status='active',
            budget=random.randint(50000, 500000),
            team_size=random.randint(10, 50),
            **kwargs
        )

class ApplicationFactory(BaseFactory):
    """申请数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    task_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    applicant_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    cover_letter = factory.LazyFunction(lambda: fake.text(max_nb_chars=300))
    proposed_budget = factory.fuzzy.FuzzyInteger(100, 2000)
    estimated_completion_time = factory.fuzzy.FuzzyInteger(1, 30)  # 天数
    status = factory.fuzzy.FuzzyChoice(['pending', 'accepted', 'rejected', 'withdrawn'])
    created_at = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-30d', end_date='now')
    )
    updated_at = factory.LazyFunction(lambda: datetime.now())
    
    # 附加信息
    portfolio_urls = factory.LazyFunction(lambda: [
        fake.url() for _ in range(random.randint(0, 3))
    ])
    relevant_experience = factory.LazyFunction(lambda: fake.text(max_nb_chars=200))

class ReviewFactory(BaseFactory):
    """评价数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    task_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    reviewer_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    reviewee_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    rating = factory.fuzzy.FuzzyInteger(1, 5)
    comment = factory.LazyFunction(lambda: fake.text(max_nb_chars=250))
    created_at = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-90d', end_date='now')
    )
    
    # 详细评分
    communication_rating = factory.fuzzy.FuzzyInteger(1, 5)
    quality_rating = factory.fuzzy.FuzzyInteger(1, 5)
    timeliness_rating = factory.fuzzy.FuzzyInteger(1, 5)
    professionalism_rating = factory.fuzzy.FuzzyInteger(1, 5)
    
    @classmethod
    def create_positive_review(cls, **kwargs) -> Dict:
        """创建正面评价"""
        return cls.build(
            rating=random.randint(4, 5),
            communication_rating=random.randint(4, 5),
            quality_rating=random.randint(4, 5),
            timeliness_rating=random.randint(4, 5),
            professionalism_rating=random.randint(4, 5),
            comment=random.choice([
                "工作质量很高，沟通顺畅，按时完成任务。",
                "技术能力强，代码质量好，推荐合作。",
                "专业负责，超出预期，值得信赖的合作伙伴。"
            ]),
            **kwargs
        )
    
    @classmethod
    def create_negative_review(cls, **kwargs) -> Dict:
        """创建负面评价"""
        return cls.build(
            rating=random.randint(1, 2),
            communication_rating=random.randint(1, 3),
            quality_rating=random.randint(1, 3),
            timeliness_rating=random.randint(1, 3),
            professionalism_rating=random.randint(1, 3),
            comment=random.choice([
                "沟通不及时，工作质量有待提高。",
                "未能按时完成任务，代码质量不符合要求。",
                "专业度不够，不推荐合作。"
            ]),
            **kwargs
        )

class NotificationFactory(BaseFactory):
    """通知数据工厂"""
    
    class Meta:
        model = dict
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    user_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    title = factory.LazyFunction(lambda: fake.sentence(nb_words=4).rstrip('.'))
    content = factory.LazyFunction(lambda: fake.text(max_nb_chars=200))
    type = factory.fuzzy.FuzzyChoice([
        'task_assigned', 'task_completed', 'application_received', 'payment_received',
        'review_received', 'system_update', 'promotion', 'reminder'
    ])
    is_read = factory.fuzzy.FuzzyChoice([True, False], weights=[3, 7])
    created_at = factory.LazyFunction(
        lambda: fake.date_time_between(start_date='-30d', end_date='now')
    )
    
    # 关联数据
    related_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    action_url = factory.LazyFunction(lambda: f"/tasks/{uuid.uuid4()}")

# 数据场景生成器
class DataScenarioGenerator:
    """数据场景生成器
    
    用于生成特定业务场景的测试数据组合
    """
    
    @staticmethod
    def create_active_marketplace_scenario() -> Dict[str, List[Dict]]:
        """创建活跃市场场景
        
        包含多个用户、任务、申请和评价的完整生态
        """
        # 创建用户
        developers = UserFactory.create_batch_dict(10)
        clients = UserFactory.create_batch_dict(5)
        admins = [UserFactory.create_admin() for _ in range(2)]
        
        # 创建技能
        skills = SkillFactory.create_batch_dict(20)
        
        # 创建任务
        active_tasks = [TaskFactory.build(status=TaskStatus.PENDING.value) for _ in range(15)]
        in_progress_tasks = [TaskFactory.build(status=TaskStatus.IN_PROGRESS.value) for _ in range(8)]
        completed_tasks = [TaskFactory.create_completed_task() for _ in range(12)]
        
        # 创建申请
        applications = ApplicationFactory.create_batch_dict(30)
        
        # 创建评价
        positive_reviews = [ReviewFactory.create_positive_review() for _ in range(15)]
        negative_reviews = [ReviewFactory.create_negative_review() for _ in range(3)]
        
        # 创建通知
        notifications = NotificationFactory.create_batch_dict(25)
        
        return {
            'users': developers + clients + admins,
            'skills': skills,
            'tasks': active_tasks + in_progress_tasks + completed_tasks,
            'applications': applications,
            'reviews': positive_reviews + negative_reviews,
            'notifications': notifications
        }
    
    @staticmethod
    def create_new_user_scenario() -> Dict[str, List[Dict]]:
        """创建新用户场景
        
        模拟新用户注册后的初始状态
        """
        # 新用户
        new_user = UserFactory.create_newbie()
        
        # 基础技能
        basic_skills = [
            SkillFactory.build(name='HTML', level=SkillLevel.BEGINNER.value),
            SkillFactory.build(name='CSS', level=SkillLevel.BEGINNER.value),
            SkillFactory.build(name='JavaScript', level=SkillLevel.BEGINNER.value)
        ]
        
        # 适合新手的任务
        beginner_tasks = [
            TaskFactory.build(
                title="简单的网页制作",
                difficulty_level='easy',
                budget_min=100,
                budget_max=300,
                estimated_hours=random.randint(5, 20)
            ) for _ in range(5)
        ]
        
        # 欢迎通知
        welcome_notifications = [
            NotificationFactory.build(
                user_id=new_user['id'],
                type='system_update',
                title='欢迎加入PhoenixCoder！',
                content='完善您的个人资料，开始您的编程之旅。',
                is_read=False
            )
        ]
        
        return {
            'users': [new_user],
            'skills': basic_skills,
            'tasks': beginner_tasks,
            'notifications': welcome_notifications
        }
    
    @staticmethod
    def create_enterprise_project_scenario() -> Dict[str, List[Dict]]:
        """创建企业项目场景
        
        模拟大型企业项目的复杂协作
        """
        # 企业客户
        enterprise_client = UserFactory.build(
            role=UserRole.USER.value,
            nickname="TechCorp Ltd.",
            bio="专业的技术服务公司，致力于数字化转型",
            is_verified=True
        )
        
        # 项目经理和开发团队
        project_manager = UserFactory.create_developer(
            nickname="项目经理张三",
            bio="10年项目管理经验，擅长敏捷开发"
        )
        
        senior_developers = [UserFactory.create_developer() for _ in range(3)]
        junior_developers = [UserFactory.create_newbie() for _ in range(2)]
        
        # 企业项目
        enterprise_project = ProjectFactory.create_enterprise_project(
            name="企业级CRM系统",
            description="为中大型企业打造的客户关系管理系统",
            owner_id=enterprise_client['id'],
            budget=200000,
            team_size=15
        )
        
        # 项目相关任务
        project_tasks = [
            TaskFactory.build(
                title="CRM系统架构设计",
                priority=TaskPriority.HIGH.value,
                budget_min=5000,
                budget_max=8000,
                publisher_id=enterprise_client['id']
            ),
            TaskFactory.build(
                title="用户界面设计与开发",
                priority=TaskPriority.MEDIUM.value,
                budget_min=3000,
                budget_max=5000,
                publisher_id=enterprise_client['id']
            ),
            TaskFactory.build(
                title="数据库设计与优化",
                priority=TaskPriority.HIGH.value,
                budget_min=4000,
                budget_max=6000,
                publisher_id=enterprise_client['id']
            )
        ]
        
        return {
            'users': [enterprise_client, project_manager] + senior_developers + junior_developers,
            'projects': [enterprise_project],
            'tasks': project_tasks
        }

# 快速数据生成函数
def generate_test_data(scenario: str = 'default', size: str = 'small') -> Dict[str, List[Dict]]:
    """快速生成测试数据
    
    Args:
        scenario: 数据场景 ('default', 'marketplace', 'new_user', 'enterprise')
        size: 数据规模 ('small', 'medium', 'large')
    
    Returns:
        包含各种实体数据的字典
    """
    size_config = {
        'small': {'users': 5, 'tasks': 10, 'applications': 8, 'reviews': 5},
        'medium': {'users': 20, 'tasks': 50, 'applications': 30, 'reviews': 25},
        'large': {'users': 100, 'tasks': 200, 'applications': 150, 'reviews': 100}
    }
    
    config = size_config.get(size, size_config['small'])
    
    if scenario == 'marketplace':
        return DataScenarioGenerator.create_active_marketplace_scenario()
    elif scenario == 'new_user':
        return DataScenarioGenerator.create_new_user_scenario()
    elif scenario == 'enterprise':
        return DataScenarioGenerator.create_enterprise_project_scenario()
    else:
        # 默认场景
        return {
            'users': UserFactory.create_batch_dict(config['users']),
            'tasks': TaskFactory.create_batch_dict(config['tasks']),
            'applications': ApplicationFactory.create_batch_dict(config['applications']),
            'reviews': ReviewFactory.create_batch_dict(config['reviews']),
            'skills': SkillFactory.create_batch_dict(15),
            'notifications': NotificationFactory.create_batch_dict(10)
        }

# 导出主要工厂类
__all__ = [
    'UserFactory',
    'SkillFactory', 
    'TaskFactory',
    'ProjectFactory',
    'ApplicationFactory',
    'ReviewFactory',
    'NotificationFactory',
    'DataScenarioGenerator',
    'generate_test_data'
]