// 分析和统计相关类型
export interface UserAnalytics {
  userId: string;
  period: AnalyticsPeriod;
  metrics: UserMetrics;
  skillProgress: SkillProgress[];
  taskStats: TaskStats;
  achievementStats: AchievementStats;
  activityTimeline: ActivityEvent[];
  generatedAt: Date;
}

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ALL_TIME = 'all_time'
}

export interface UserMetrics {
  totalTasks: number;
  completedTasks: number;
  successRate: number;
  averageRating: number;
  totalEarnings: number;
  experienceGained: number;
  skillsLearned: number;
  achievementsUnlocked: number;
  activeStreak: number;
  longestStreak: number;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  experienceGained: number;
  tasksCompleted: number;
  improvementRate: number;
  lastUpdated: Date;
}

export interface TaskStats {
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  byStatus: Record<string, number>;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  qualityScore: number;
}

export interface AchievementStats {
  total: number;
  byCategory: Record<string, number>;
  byRarity: Record<string, number>;
  recentUnlocks: string[];
  progressToNext: AchievementProgress[];
}

export interface AchievementProgress {
  achievementId: string;
  achievementName: string;
  currentProgress: number;
  requiredProgress: number;
  progressPercentage: number;
  estimatedCompletion?: Date;
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  impact: ActivityImpact;
}

export enum ActivityType {
  TASK_COMPLETED = 'task_completed',
  SKILL_IMPROVED = 'skill_improved',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  RATING_RECEIVED = 'rating_received',
  PAYMENT_RECEIVED = 'payment_received'
}

export interface ActivityImpact {
  experienceGained?: number;
  skillPointsGained?: number;
  reputationChange?: number;
  earningsChange?: number;
}

// 平台分析
export interface PlatformAnalytics {
  period: AnalyticsPeriod;
  userMetrics: PlatformUserMetrics;
  taskMetrics: PlatformTaskMetrics;
  engagementMetrics: EngagementMetrics;
  revenueMetrics: RevenueMetrics;
  performanceMetrics: PerformanceMetrics;
  generatedAt: Date;
}

export interface PlatformUserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  churnRate: number;
  averageSessionDuration: number;
  userGrowthRate: number;
  usersByLevel: Record<string, number>;
  usersByRegion: Record<string, number>;
}

export interface PlatformTaskMetrics {
  totalTasks: number;
  publishedTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTaskValue: number;
  tasksByCategory: Record<string, number>;
  tasksByDifficulty: Record<string, number>;
  averageCompletionTime: number;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionsPerUser: number;
  averagePageViews: number;
  bounceRate: number;
  featureUsage: Record<string, number>;
  userFeedbackScore: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  averageRevenuePerUser: number;
  revenueByCategory: Record<string, number>;
  commissionEarned: number;
  payoutsMade: number;
  revenueRetention: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
  databasePerformance: DatabaseMetrics;
  apiPerformance: ApiMetrics;
}

export interface DatabaseMetrics {
  queryTime: number;
  connectionPoolUsage: number;
  slowQueries: number;
  deadlocks: number;
}

export interface ApiMetrics {
  requestsPerSecond: number;
  averageLatency: number;
  errorsByEndpoint: Record<string, number>;
  rateLimitHits: number;
}

// 企业版特有的分析类型
export interface EnterpriseAnalytics {
  teamMetrics: TeamMetrics;
  departmentMetrics: DepartmentMetrics[];
  costAnalysis: CostAnalysis;
  complianceMetrics: ComplianceMetrics;
  customMetrics: CustomMetric[];
}

export interface TeamMetrics {
  teamId: string;
  teamName: string;
  memberCount: number;
  productivity: ProductivityMetrics;
  collaboration: CollaborationMetrics;
  skillDistribution: SkillDistribution[];
}

export interface ProductivityMetrics {
  tasksPerMember: number;
  averageCompletionTime: number;
  qualityScore: number;
  velocityTrend: number[];
  burndownData: BurndownPoint[];
}

export interface CollaborationMetrics {
  crossTeamTasks: number;
  knowledgeSharing: number;
  mentorshipActivities: number;
  codeReviews: number;
}

export interface SkillDistribution {
  skillName: string;
  memberCount: number;
  averageLevel: number;
  skillGap: number;
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  budget: number;
  spending: number;
  roi: number;
  headcount: number;
  productivity: number;
}

export interface CostAnalysis {
  totalCost: number;
  costPerUser: number;
  costByFeature: Record<string, number>;
  costTrend: CostTrendPoint[];
  budgetUtilization: number;
}

export interface CostTrendPoint {
  date: Date;
  cost: number;
  users: number;
  costPerUser: number;
}

export interface ComplianceMetrics {
  dataRetentionCompliance: number;
  accessControlCompliance: number;
  auditTrailCompleteness: number;
  securityIncidents: number;
  complianceScore: number;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  trend: number;
  target?: number;
  threshold?: MetricThreshold;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
}

export interface BurndownPoint {
  date: Date;
  remaining: number;
  ideal: number;
  actual: number;
}

// 报表相关
export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  config: ReportConfig;
  schedule?: ReportSchedule;
  recipients: string[];
  createdBy: string;
  createdAt: Date;
  lastGenerated?: Date;
}

export enum ReportType {
  USER_ANALYTICS = 'user_analytics',
  PLATFORM_ANALYTICS = 'platform_analytics',
  TEAM_PERFORMANCE = 'team_performance',
  FINANCIAL = 'financial',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom'
}

export interface ReportConfig {
  period: AnalyticsPeriod;
  metrics: string[];
  filters: Record<string, any>;
  format: ReportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  enabled: boolean;
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}