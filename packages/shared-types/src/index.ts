// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  skills: Skill[];
  level: UserLevel;
  experience: number;
  reputation: number;
}

export enum UserLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    taskUpdates: boolean;
    achievements: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
    showAchievements: boolean;
  };
}

export interface UserStats {
  tasksCompleted: number;
  tasksInProgress: number;
  totalEarnings: number;
  averageRating: number;
  skillsCount: number;
  achievementsCount: number;
  streakDays: number;
  joinedDate: Date;
}

// 技能相关类型
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  experience: number;
  verified: boolean;
}

export enum SkillCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  MOBILE = 'mobile',
  DEVOPS = 'devops',
  DATABASE = 'database',
  AI_ML = 'ai_ml',
  DESIGN = 'design',
  OTHER = 'other'
}

export enum SkillLevel {
  NOVICE = 1,
  BEGINNER = 2,
  INTERMEDIATE = 3,
  ADVANCED = 4,
  EXPERT = 5
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skill: Skill;
  level: SkillLevel;
  experience: number;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  endorsements: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillAssessment {
  id: string;
  userId: string;
  skillId: string;
  assessorId: string;
  score: number;
  maxScore: number;
  level: SkillLevel;
  feedback?: string;
  questions: AssessmentQuestion[];
  answers: AssessmentAnswer[];
  completedAt: Date;
  validUntil?: Date;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'code' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points: number;
}

// 任务相关类型
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  requiredSkills: string[];
  reward: TaskReward;
  deadline: Date;
  status: TaskStatus;
  publisherId: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskCategory {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  CONSULTATION = 'consultation',
  CODE_REVIEW = 'code_review',
  BUG_FIX = 'bug_fix',
  FEATURE = 'feature'
}

export enum TaskDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export interface TaskReward {
  type: RewardType;
  amount: number;
  currency?: string;
  points?: number;
}

export enum RewardType {
  MONEY = 'money',
  POINTS = 'points',
  MIXED = 'mixed'
}

export enum TaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface TaskReviewData {
  reviewerId: string;
  rating: number;
  comment?: string;
  approved: boolean;
  reviewedAt: Date;
}

// 成就和勋章类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  type: AchievementType;
  rarity: AchievementRarity;
  requirements: AchievementRequirement[];
  points: number;
  difficulty: number;
  isActive: boolean;
  isSecret?: boolean;
  prerequisites?: string[];
  rewards?: Record<string, unknown>;
  badge?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AchievementCategory {
  TASK_COMPLETION = 'task_completion',
  SKILL_MASTERY = 'skill_mastery',
  COMMUNITY = 'community',
  STREAK = 'streak',
  SPECIAL = 'special'
}

export enum AchievementType {
  MILESTONE = 'milestone',
  BADGE = 'badge',
  TROPHY = 'trophy',
  CERTIFICATE = 'certificate'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface AchievementRequirement {
  type: string;
  value: number;
  description: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: number;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  pagination?: PaginationInfo;
  status?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 通用类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 版本差异化类型
export enum VersionType {
  COMMUNITY = 'community',
  ENTERPRISE = 'enterprise'
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  version: VersionType;
  description?: string;
}

// 导出所有类型
export * from './auth';
export * from './notification';
export * from './analytics';