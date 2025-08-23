/**
 * 前端测试数据工厂
 * 
 * 提供React组件和页面测试所需的模拟数据生成功能
 */

import { faker } from '@faker-js/faker/locale/zh_CN';
import { v4 as uuidv4 } from 'uuid';
import { User, UserType } from '../src/features/UserManagement/types/index';

// 简化的测试类型定义（仅用于不存在实际类型的情况）
export interface Task {
  id: string;
  title: string;
  description: string;
  requirements: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  publisherId: string;
  assigneeId?: string;
  tags: string[];
  estimatedHours: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  remoteAllowed: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'programming_language' | 'framework' | 'database' | 'tool' | 'platform' | 'methodology';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experienceYears: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  budget: number;
  ownerId: string;
  teamSize: number;
  techStack: string[];
  repositoryUrl?: string;
  demoUrl?: string;
}

export interface Application {
  id: string;
  taskId: string;
  applicantId: string;
  coverLetter: string;
  proposedBudget: number;
  estimatedCompletionTime: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
  portfolioUrls: string[];
  relevantExperience: string;
}

export interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
  communicationRating: number;
  qualityRating: number;
  timelinessRating: number;
  professionalismRating: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'task_assigned' | 'task_completed' | 'application_received' | 'payment_received' | 'review_received' | 'system_update' | 'promotion' | 'reminder';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  actionUrl?: string;
}

// 基础工厂类
class BaseFactory<T> {
  protected buildData(): Partial<T> {
    return {};
  }

  build(overrides: Partial<T> = {}): T {
    const baseData = this.buildData();
    return { ...baseData, ...overrides } as T;
  }

  buildList(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  buildBatch(count: number, overridesList: Partial<T>[] = []): T[] {
    return Array.from({ length: count }, (_, index) => {
      const overrides = overridesList[index] || {};
      return this.build(overrides);
    });
  }
}

// 用户工厂
export class UserFactory extends BaseFactory<User> {
  protected buildData(): User {
    const userTypes = [UserType.DEVELOPER, UserType.CLIENT, UserType.ADMIN, UserType.REVIEWER];
    const createdAt = faker.date.between({ from: '2022-01-01', to: new Date() });
    
    return {
      id: uuidv4(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      bio: faker.lorem.paragraph({ min: 1, max: 3 }),
      userType: faker.helpers.arrayElement(userTypes),
      isActive: faker.helpers.weightedArrayElement([
        { weight: 9, value: true },
        { weight: 1, value: false }
      ]),
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
      phone: faker.phone.number(),
      location: faker.location.city(),
      skills: faker.helpers.arrayElements(['Python', 'JavaScript', 'React', 'Node.js'], { min: 1, max: 4 }),
      experienceLevel: faker.helpers.arrayElement(['junior', 'mid', 'senior', 'expert']),
      hourlyRate: faker.number.int({ min: 20, max: 200 }),
      profileCompletion: faker.number.int({ min: 50, max: 100 }),
      rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
      totalTasks: faker.number.int({ min: 0, max: 100 }),
      completedTasks: faker.number.int({ min: 0, max: 50 })
    };
  }

  static createAdmin(overrides: Partial<User> = {}): User {
    return new UserFactory().build({
      userType: UserType.ADMIN,
      isActive: true,
      ...overrides
    });
  }

  static createDeveloper(overrides: Partial<User> = {}): User {
    const skills = ['Python', 'JavaScript', 'React', 'Node.js', 'Docker'];
    return new UserFactory().build({
      userType: UserType.DEVELOPER,
      isActive: true,
      bio: `资深开发者，擅长 ${faker.helpers.arrayElements(skills, 3).join(', ')} 等技术`,
      skills,
      experienceLevel: 'senior',
      ...overrides
    });
  }

  static createNewbie(overrides: Partial<User> = {}): User {
    return new UserFactory().build({
      userType: UserType.DEVELOPER,
      isActive: true,
      bio: '编程新手，正在学习中',
      experienceLevel: 'junior',
      createdAt: faker.date.between({ from: '2024-01-01', to: new Date() }).toISOString(),
      ...overrides
    });
  }
}

// 技能工厂
export class SkillFactory extends BaseFactory<Skill> {
  protected buildData(): Skill {
    const skillNames = [
      'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#',
      'React', 'Vue.js', 'Angular', 'Node.js', 'Django', 'FastAPI', 'Spring Boot',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'PostgreSQL', 'MongoDB', 'Redis',
      'Git', 'CI/CD', 'Linux', 'Nginx', 'GraphQL', 'REST API', 'Microservices',
      'Machine Learning', 'Data Science', 'DevOps', 'Frontend', 'Backend', 'Full Stack'
    ];
    
    const categories: Skill['category'][] = [
      'programming_language', 'framework', 'database', 'tool', 'platform', 'methodology'
    ];
    
    const levels: Skill['level'][] = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    return {
      id: uuidv4(),
      name: faker.helpers.arrayElement(skillNames),
      description: faker.lorem.sentence({ min: 5, max: 15 }),
      category: faker.helpers.arrayElement(categories),
      level: faker.helpers.arrayElement(levels),
      experienceYears: faker.number.int({ min: 0, max: 10 }),
      createdAt: new Date().toISOString()
    };
  }

  static createProgrammingLanguage(overrides: Partial<Skill> = {}): Skill {
    const languages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#'];
    return new SkillFactory().build({
      name: faker.helpers.arrayElement(languages),
      category: 'programming_language',
      ...overrides
    });
  }

  static createFramework(overrides: Partial<Skill> = {}): Skill {
    const frameworks = ['React', 'Vue.js', 'Angular', 'Django', 'FastAPI', 'Spring Boot', 'Express.js'];
    return new SkillFactory().build({
      name: faker.helpers.arrayElement(frameworks),
      category: 'framework',
      ...overrides
    });
  }
}

// 任务工厂
export class TaskFactory extends BaseFactory<Task> {
  protected buildData(): Task {
    const statuses: Task['status'][] = ['pending', 'in_progress', 'completed', 'cancelled'];
    const priorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const difficulties: Task['difficultyLevel'][] = ['easy', 'medium', 'hard', 'expert'];
    
    const tags = [
      'web开发', '移动开发', '数据分析', '机器学习', 'UI设计', '后端开发',
      '前端开发', 'DevOps', '测试', '文档编写', '代码审查', '性能优化'
    ];
    
    const budgetMin = faker.number.int({ min: 100, max: 1000 });
    const createdAt = faker.date.between({ from: '2023-01-01', to: new Date() });
    
    return {
      id: uuidv4(),
      title: faker.lorem.sentence({ min: 3, max: 8 }).replace('.', ''),
      description: faker.lorem.paragraphs({ min: 2, max: 4 }),
      requirements: faker.lorem.paragraph({ min: 3, max: 6 }),
      status: faker.helpers.arrayElement(statuses),
      priority: faker.helpers.arrayElement(priorities),
      budgetMin,
      budgetMax: budgetMin + faker.number.int({ min: 200, max: 2000 }),
      deadline: faker.date.between({ from: new Date(), to: '2024-12-31' }).toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      publisherId: uuidv4(),
      assigneeId: faker.helpers.maybe(() => uuidv4(), { probability: 0.6 }),
      tags: faker.helpers.arrayElements(tags, { min: 1, max: 4 }),
      estimatedHours: faker.number.int({ min: 1, max: 200 }),
      difficultyLevel: faker.helpers.arrayElement(difficulties),
      remoteAllowed: faker.helpers.weightedArrayElement([
        { weight: 7, value: true },
        { weight: 3, value: false }
      ])
    };
  }

  static createUrgentTask(overrides: Partial<Task> = {}): Task {
    return new TaskFactory().build({
      priority: 'urgent',
      deadline: faker.date.between({ from: new Date(), to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }).toISOString(),
      budgetMin: 500,
      budgetMax: 2000,
      ...overrides
    });
  }

  static createLongTermTask(overrides: Partial<Task> = {}): Task {
    return new TaskFactory().build({
      priority: 'medium',
      deadline: faker.date.between({ from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) }).toISOString(),
      estimatedHours: faker.number.int({ min: 100, max: 500 }),
      ...overrides
    });
  }

  static createCompletedTask(overrides: Partial<Task> = {}): Task {
    const createdAt = faker.date.between({ from: '2023-01-01', to: '2023-12-31' });
    const updatedAt = new Date(createdAt.getTime() + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000);
    
    return new TaskFactory().build({
      status: 'completed',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      assigneeId: uuidv4(),
      ...overrides
    });
  }
}

// 项目工厂
export class ProjectFactory extends BaseFactory<Project> {
  protected buildData(): Project {
    const statuses: Project['status'][] = ['planning', 'active', 'completed', 'cancelled'];
    const techStack = [
      'React', 'Vue.js', 'Node.js', 'Python', 'Django', 'PostgreSQL',
      'Redis', 'Docker', 'AWS', 'TypeScript', 'GraphQL', 'MongoDB'
    ];
    
    const startDate = faker.date.between({ from: '2023-01-01', to: new Date() });
    const endDate = new Date(startDate.getTime() + faker.number.int({ min: 30, max: 365 }) * 24 * 60 * 60 * 1000);
    
    return {
      id: uuidv4(),
      name: `${faker.company.name()} ${faker.helpers.arrayElement(['平台', '系统', '应用', '工具'])}`,
      description: faker.lorem.paragraphs({ min: 2, max: 4 }),
      status: faker.helpers.arrayElement(statuses),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      budget: faker.number.int({ min: 5000, max: 100000 }),
      ownerId: uuidv4(),
      teamSize: faker.number.int({ min: 2, max: 15 }),
      techStack: faker.helpers.arrayElements(techStack, { min: 3, max: 8 }),
      repositoryUrl: `https://github.com/${faker.internet.userName()}/${faker.lorem.slug()}`,
      demoUrl: faker.internet.url()
    };
  }

  static createStartupProject(overrides: Partial<Project> = {}): Project {
    return new ProjectFactory().build({
      status: 'active',
      budget: faker.number.int({ min: 10000, max: 50000 }),
      teamSize: faker.number.int({ min: 2, max: 8 }),
      ...overrides
    });
  }

  static createEnterpriseProject(overrides: Partial<Project> = {}): Project {
    return new ProjectFactory().build({
      status: 'active',
      budget: faker.number.int({ min: 50000, max: 500000 }),
      teamSize: faker.number.int({ min: 10, max: 50 }),
      ...overrides
    });
  }
}

// 申请工厂
export class ApplicationFactory extends BaseFactory<Application> {
  protected buildData(): Application {
    const statuses: Application['status'][] = ['pending', 'accepted', 'rejected', 'withdrawn'];
    
    return {
      id: uuidv4(),
      taskId: uuidv4(),
      applicantId: uuidv4(),
      coverLetter: faker.lorem.paragraphs({ min: 2, max: 4 }),
      proposedBudget: faker.number.int({ min: 100, max: 2000 }),
      estimatedCompletionTime: faker.number.int({ min: 1, max: 30 }),
      status: faker.helpers.arrayElement(statuses),
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }).toISOString(),
      updatedAt: new Date().toISOString(),
      portfolioUrls: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => faker.internet.url()),
      relevantExperience: faker.lorem.paragraph({ min: 2, max: 4 })
    };
  }
}

// 评价工厂
export class ReviewFactory extends BaseFactory<Review> {
  protected buildData(): Review {
    const rating = faker.number.int({ min: 1, max: 5 });
    
    return {
      id: uuidv4(),
      taskId: uuidv4(),
      reviewerId: uuidv4(),
      revieweeId: uuidv4(),
      rating,
      comment: faker.lorem.paragraph({ min: 2, max: 4 }),
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }).toISOString(),
      communicationRating: faker.number.int({ min: Math.max(1, rating - 1), max: Math.min(5, rating + 1) }),
      qualityRating: faker.number.int({ min: Math.max(1, rating - 1), max: Math.min(5, rating + 1) }),
      timelinessRating: faker.number.int({ min: Math.max(1, rating - 1), max: Math.min(5, rating + 1) }),
      professionalismRating: faker.number.int({ min: Math.max(1, rating - 1), max: Math.min(5, rating + 1) })
    };
  }

  static createPositiveReview(overrides: Partial<Review> = {}): Review {
    const rating = faker.number.int({ min: 4, max: 5 });
    const comments = [
      '工作质量很高，沟通顺畅，按时完成任务。',
      '技术能力强，代码质量好，推荐合作。',
      '专业负责，超出预期，值得信赖的合作伙伴。'
    ];
    
    return new ReviewFactory().build({
      rating,
      communicationRating: faker.number.int({ min: 4, max: 5 }),
      qualityRating: faker.number.int({ min: 4, max: 5 }),
      timelinessRating: faker.number.int({ min: 4, max: 5 }),
      professionalismRating: faker.number.int({ min: 4, max: 5 }),
      comment: faker.helpers.arrayElement(comments),
      ...overrides
    });
  }

  static createNegativeReview(overrides: Partial<Review> = {}): Review {
    const rating = faker.number.int({ min: 1, max: 2 });
    const comments = [
      '沟通不及时，工作质量有待提高。',
      '未能按时完成任务，代码质量不符合要求。',
      '专业度不够，不推荐合作。'
    ];
    
    return new ReviewFactory().build({
      rating,
      communicationRating: faker.number.int({ min: 1, max: 3 }),
      qualityRating: faker.number.int({ min: 1, max: 3 }),
      timelinessRating: faker.number.int({ min: 1, max: 3 }),
      professionalismRating: faker.number.int({ min: 1, max: 3 }),
      comment: faker.helpers.arrayElement(comments),
      ...overrides
    });
  }
}

// 通知工厂
export class NotificationFactory extends BaseFactory<Notification> {
  protected buildData(): Notification {
    const types: Notification['type'][] = [
      'task_assigned', 'task_completed', 'application_received', 'payment_received',
      'review_received', 'system_update', 'promotion', 'reminder'
    ];
    
    return {
      id: uuidv4(),
      userId: uuidv4(),
      title: faker.lorem.sentence({ min: 3, max: 6 }).replace('.', ''),
      content: faker.lorem.paragraph({ min: 1, max: 3 }),
      type: faker.helpers.arrayElement(types),
      isRead: faker.helpers.weightedArrayElement([
        { weight: 3, value: true },
        { weight: 7, value: false }
      ]),
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }).toISOString(),
      relatedId: faker.helpers.maybe(() => uuidv4(), { probability: 0.8 }),
      actionUrl: faker.helpers.maybe(() => `/tasks/${uuidv4()}`, { probability: 0.6 })
    };
  }
}

// 数据场景生成器
export class DataScenarioGenerator {
  /**
   * 创建活跃市场场景
   */
  static createActiveMarketplaceScenario() {
    const developers = new UserFactory().buildList(10);
    const clients = new UserFactory().buildList(5);
    const admins = [UserFactory.createAdmin(), UserFactory.createAdmin()];
    
    const skills = new SkillFactory().buildList(20);
    
    const activeTasks = new TaskFactory().buildBatch(15, 
      Array(15).fill({ status: 'pending' as const })
    );
    const inProgressTasks = new TaskFactory().buildBatch(8, 
      Array(8).fill({ status: 'in_progress' as const })
    );
    const completedTasks = Array.from({ length: 12 }, () => TaskFactory.createCompletedTask());
    
    const applications = new ApplicationFactory().buildList(30);
    
    const positiveReviews = Array.from({ length: 15 }, () => ReviewFactory.createPositiveReview());
    const negativeReviews = Array.from({ length: 3 }, () => ReviewFactory.createNegativeReview());
    
    const notifications = new NotificationFactory().buildList(25);
    
    return {
      users: [...developers, ...clients, ...admins],
      skills,
      tasks: [...activeTasks, ...inProgressTasks, ...completedTasks],
      applications,
      reviews: [...positiveReviews, ...negativeReviews],
      notifications
    };
  }

  /**
   * 创建新用户场景
   */
  static createNewUserScenario() {
    const newUser = UserFactory.createNewbie();
    
    const basicSkills = [
      new SkillFactory().build({ name: 'HTML', level: 'beginner' }),
      new SkillFactory().build({ name: 'CSS', level: 'beginner' }),
      new SkillFactory().build({ name: 'JavaScript', level: 'beginner' })
    ];
    
    const beginnerTasks = Array.from({ length: 5 }, () => 
      new TaskFactory().build({
        title: '简单的网页制作',
        difficultyLevel: 'easy',
        budgetMin: 100,
        budgetMax: 300,
        estimatedHours: faker.number.int({ min: 5, max: 20 })
      })
    );
    
    const welcomeNotifications = [
      new NotificationFactory().build({
        userId: newUser.id,
        type: 'system_update',
        title: '欢迎加入PhoenixCoder！',
        content: '完善您的个人资料，开始您的编程之旅。',
        isRead: false
      })
    ];
    
    return {
      users: [newUser],
      skills: basicSkills,
      tasks: beginnerTasks,
      notifications: welcomeNotifications
    };
  }

  /**
   * 创建企业项目场景
   */
  static createEnterpriseProjectScenario() {
    const enterpriseClient = new UserFactory().build({
      userType: UserType.CLIENT,
      fullName: 'TechCorp Ltd.',
      bio: '专业的技术服务公司，致力于数字化转型',
      isActive: true
    });
    
    const projectManager = UserFactory.createDeveloper({
      fullName: '项目经理张三',
      bio: '10年项目管理经验，擅长敏捷开发'
    });
    
    const seniorDevelopers = Array.from({ length: 3 }, () => UserFactory.createDeveloper());
    const juniorDevelopers = Array.from({ length: 2 }, () => UserFactory.createNewbie());
    
    const enterpriseProject = ProjectFactory.createEnterpriseProject({
      name: '企业级CRM系统',
      description: '为中大型企业打造的客户关系管理系统',
      ownerId: enterpriseClient.id,
      budget: 200000,
      teamSize: 15
    });
    
    const projectTasks = [
      new TaskFactory().build({
        title: 'CRM系统架构设计',
        priority: 'high' as const,
        budgetMin: 5000,
        budgetMax: 8000,
        publisherId: enterpriseClient.id
      }),
      new TaskFactory().build({
        title: '用户界面设计与开发',
        priority: 'medium' as const,
        budgetMin: 3000,
        budgetMax: 5000,
        publisherId: enterpriseClient.id
      }),
      new TaskFactory().build({
        title: '数据库设计与优化',
        priority: 'high' as const,
        budgetMin: 4000,
        budgetMax: 6000,
        publisherId: enterpriseClient.id
      })
    ];
    
    return {
      users: [enterpriseClient, projectManager, ...seniorDevelopers, ...juniorDevelopers],
      projects: [enterpriseProject],
      tasks: projectTasks
    };
  }
}

/**
 * 快速生成测试数据
 */
export function generateTestData(
  scenario: 'default' | 'marketplace' | 'new_user' | 'enterprise' = 'default',
  size: 'small' | 'medium' | 'large' = 'small'
) {
  const sizeConfig = {
    small: { users: 5, tasks: 10, applications: 8, reviews: 5 },
    medium: { users: 20, tasks: 50, applications: 30, reviews: 25 },
    large: { users: 100, tasks: 200, applications: 150, reviews: 100 }
  };
  
  const config = sizeConfig[size];
  
  switch (scenario) {
    case 'marketplace':
      return DataScenarioGenerator.createActiveMarketplaceScenario();
    case 'new_user':
      return DataScenarioGenerator.createNewUserScenario();
    case 'enterprise':
      return DataScenarioGenerator.createEnterpriseProjectScenario();
    default:
      return {
        users: new UserFactory().buildList(config.users),
        tasks: new TaskFactory().buildList(config.tasks),
        applications: new ApplicationFactory().buildList(config.applications),
        reviews: new ReviewFactory().buildList(config.reviews),
        skills: new SkillFactory().buildList(15),
        notifications: new NotificationFactory().buildList(10)
      };
  }
}