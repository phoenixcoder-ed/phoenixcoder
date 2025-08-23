import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Progress } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { Separator } from '../ui/Separator';
import { Tabs } from '../ui/Tabs';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { LevelBadge } from './LevelBadge';
import { SkillTag } from './SkillTag';
import { AchievementCard } from './AchievementCard';
import {
  Trophy,
  Award,
  Crown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  Target,
  Zap,
  Flame,
  Clock,
  BarChart,
  PieChart,
  Activity,
  Filter,
  Search,
  RefreshCw,
  Download,
  Share,
  Eye,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';

// 排行榜类型枚举
export enum LeaderBoardType {
  OVERALL = 'overall',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  SKILL_BASED = 'skill_based',
  TASK_COMPLETION = 'task_completion',
  EXPERIENCE = 'experience',
  ACHIEVEMENTS = 'achievements',
  CONTRIBUTIONS = 'contributions',
  REPUTATION = 'reputation'
}

// 排名变化类型
export enum RankChange {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
  NEW = 'new'
}

// 用户状态枚举
export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy'
}

// 排行榜条目接口
export interface LeaderBoardEntry {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  rank: number;
  previousRank?: number;
  rankChange: RankChange;
  score: number;
  previousScore?: number;
  level: number;
  experience: number;
  status: UserStatus;
  badges: string[];
  achievements: string[];
  skills: string[];
  joinDate: Date;
  lastActive: Date;
  
  // 统计数据
  stats: {
    tasksCompleted: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    streakDays: number;
    contributionScore: number;
    helpfulVotes: number;
    mentorshipHours: number;
  };
  
  // 时间段数据
  periodData?: {
    weeklyScore: number;
    monthlyScore: number;
    yearlyScore: number;
    weeklyRank: number;
    monthlyRank: number;
    yearlyRank: number;
  };
}

// 排行榜过滤器
export interface LeaderBoardFilters {
  type: LeaderBoardType;
  skillFilter: string[];
  levelRange: [number, number];
  experienceRange: [number, number];
  statusFilter: UserStatus[];
  search: string;
  showOnlyFollowing: boolean;
  showOnlyVerified: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// 排行榜统计
export interface LeaderBoardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  averageScore: number;
  topScore: number;
  averageLevel: number;
  totalExperience: number;
  distributionByLevel: Record<number, number>;
  distributionByScore: Record<string, number>;
}

// 排行榜属性接口
export interface LeaderBoardProps {
  entries: LeaderBoardEntry[];
  type?: LeaderBoardType;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'compact' | 'detailed' | 'card' | 'minimal';
  layout?: 'list' | 'grid' | 'table';
  className?: string;
  
  // 显示选项
  showRankChange?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showUserDetails?: boolean;
  showAchievements?: boolean;
  showSkills?: boolean;
  showProgress?: boolean;
  
  // 分页选项
  currentPage?: number;
  pageSize?: number;
  total?: number;
  
  // 当前用户
  currentUserId?: string;
  
  // 过滤和搜索
  filters?: LeaderBoardFilters;
  onFiltersChange?: (filters: LeaderBoardFilters) => void;
  
  // 事件回调
  onUserClick?: (entry: LeaderBoardEntry) => void;
  onUserFollow?: (userId: string) => void;
  onUserMessage?: (userId: string) => void;
  onUserReport?: (userId: string) => void;
  onTypeChange?: (type: LeaderBoardType) => void;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  
  // 自定义渲染
  renderEntry?: (entry: LeaderBoardEntry, index: number) => React.ReactNode;
  renderStats?: (stats: LeaderBoardStats) => React.ReactNode;
}

// 排行榜类型配置
const leaderBoardTypeConfig = {
  [LeaderBoardType.OVERALL]: {
    icon: Trophy,
    label: '总排行榜',
    description: '基于总体表现的排名'
  },
  [LeaderBoardType.WEEKLY]: {
    icon: Calendar,
    label: '周排行榜',
    description: '本周表现排名'
  },
  [LeaderBoardType.MONTHLY]: {
    icon: Calendar,
    label: '月排行榜',
    description: '本月表现排名'
  },
  [LeaderBoardType.YEARLY]: {
    icon: Calendar,
    label: '年排行榜',
    description: '本年表现排名'
  },
  [LeaderBoardType.SKILL_BASED]: {
    icon: Target,
    label: '技能排行榜',
    description: '基于技能水平的排名'
  },
  [LeaderBoardType.TASK_COMPLETION]: {
    icon: CheckCircle,
    label: '任务完成榜',
    description: '基于任务完成情况的排名'
  },
  [LeaderBoardType.EXPERIENCE]: {
    icon: Star,
    label: '经验排行榜',
    description: '基于经验值的排名'
  },
  [LeaderBoardType.ACHIEVEMENTS]: {
    icon: Award,
    label: '成就排行榜',
    description: '基于成就数量的排名'
  },
  [LeaderBoardType.CONTRIBUTIONS]: {
    icon: Users,
    label: '贡献排行榜',
    description: '基于社区贡献的排名'
  },
  [LeaderBoardType.REPUTATION]: {
    icon: Award,
    label: '声誉排行榜',
    description: '基于用户声誉的排名'
  }
};

// 排名变化配置
const rankChangeConfig = {
  [RankChange.UP]: {
    icon: TrendingUp,
    color: 'green',
    label: '上升'
  },
  [RankChange.DOWN]: {
    icon: TrendingDown,
    color: 'red',
    label: '下降'
  },
  [RankChange.SAME]: {
    icon: Minus,
    color: 'gray',
    label: '持平'
  },
  [RankChange.NEW]: {
    icon: Star,
    color: 'blue',
    label: '新上榜'
  }
};

// 用户状态配置
const userStatusConfig = {
  [UserStatus.ONLINE]: {
    color: 'green',
    label: '在线'
  },
  [UserStatus.OFFLINE]: {
    color: 'gray',
    label: '离线'
  },
  [UserStatus.AWAY]: {
    color: 'yellow',
    label: '离开'
  },
  [UserStatus.BUSY]: {
    color: 'red',
    label: '忙碌'
  }
};

// 尺寸配置
const sizeConfig = {
  sm: {
    avatar: 'w-8 h-8',
    text: 'text-sm',
    padding: 'p-2'
  },
  default: {
    avatar: 'w-10 h-10',
    text: 'text-base',
    padding: 'p-3'
  },
  lg: {
    avatar: 'w-12 h-12',
    text: 'text-lg',
    padding: 'p-4'
  }
};

// 辅助函数
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatScore = (score: number): string => {
  return formatNumber(score);
};

const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${hours}小时前`;
  }
  return `${days}天前`;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return Crown;
    case 2:
      return Trophy;
    case 3:
      return Award;
    default:
      return null;
  }
};

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'text-yellow-500';
    case 2:
      return 'text-gray-400';
    case 3:
      return 'text-amber-600';
    default:
      return 'text-gray-600';
  }
};

const calculateStats = (entries: LeaderBoardEntry[]): LeaderBoardStats => {
  const stats: LeaderBoardStats = {
    totalUsers: entries.length,
    activeUsers: 0,
    newUsers: 0,
    averageScore: 0,
    topScore: 0,
    averageLevel: 0,
    totalExperience: 0,
    distributionByLevel: {},
    distributionByScore: {}
  };
  
  if (entries.length === 0) return stats;
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  let totalScore = 0;
  let totalLevel = 0;
  
  entries.forEach(entry => {
    // 活跃用户统计
    if (entry.status === UserStatus.ONLINE || entry.lastActive > weekAgo) {
      stats.activeUsers++;
    }
    
    // 新用户统计
    if (entry.joinDate > weekAgo) {
      stats.newUsers++;
    }
    
    // 分数统计
    totalScore += entry.score;
    if (entry.score > stats.topScore) {
      stats.topScore = entry.score;
    }
    
    // 等级统计
    totalLevel += entry.level;
    stats.distributionByLevel[entry.level] = (stats.distributionByLevel[entry.level] || 0) + 1;
    
    // 经验统计
    stats.totalExperience += entry.experience;
    
    // 分数分布统计
    const scoreRange = Math.floor(entry.score / 1000) * 1000;
    const rangeKey = `${scoreRange}-${scoreRange + 999}`;
    stats.distributionByScore[rangeKey] = (stats.distributionByScore[rangeKey] || 0) + 1;
  });
  
  stats.averageScore = totalScore / entries.length;
  stats.averageLevel = totalLevel / entries.length;
  
  return stats;
};

// 排行榜条目组件
interface LeaderBoardEntryProps {
  entry: LeaderBoardEntry;
  index: number;
  size: 'sm' | 'default' | 'lg';
  variant: 'default' | 'compact' | 'detailed' | 'card' | 'minimal';
  layout: 'list' | 'grid' | 'table';
  showRankChange: boolean;
  showUserDetails: boolean;
  showAchievements: boolean;
  showSkills: boolean;
  showProgress: boolean;
  isCurrentUser: boolean;
  onClick?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onReport?: () => void;
}

const LeaderBoardEntryComponent: React.FC<LeaderBoardEntryProps> = ({
  entry,
  index,
  size,
  variant,
  layout,
  showRankChange,
  showUserDetails,
  showAchievements,
  showSkills,
  showProgress,
  isCurrentUser,
  onClick,
  onFollow,
  onMessage,
  onReport
}) => {
  const sizeConf = sizeConfig[size];
  const RankIcon = getRankIcon(entry.rank);
  const rankColor = getRankColor(entry.rank);
  const changeConfig = rankChangeConfig[entry.rankChange];
  const ChangeIcon = changeConfig.icon;
  const statusConfig = userStatusConfig[entry.status];
  
  const rankChange = entry.previousRank ? entry.rank - entry.previousRank : 0;
  
  if (variant === 'card') {
    return (
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg',
        isCurrentUser && 'ring-2 ring-blue-500',
        onClick && 'cursor-pointer'
      )}>
        <div className={cn('space-y-4', sizeConf.padding)} onClick={onClick}>
          {/* 排名和变化 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {RankIcon ? (
                <RankIcon className={cn('w-6 h-6', rankColor)} />
              ) : (
                <div className={cn('font-bold text-xl', rankColor)}>#{entry.rank}</div>
              )}
              
              {showRankChange && entry.previousRank && (
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  changeConfig.color === 'green' && 'text-green-600',
                  changeConfig.color === 'red' && 'text-red-600',
                  changeConfig.color === 'gray' && 'text-gray-600',
                  changeConfig.color === 'blue' && 'text-blue-600'
                )}>
                  <ChangeIcon className="w-3 h-3" />
                  {Math.abs(rankChange)}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="font-bold">{formatScore(entry.score)}</div>
              <div className="text-sm text-muted-foreground">分数</div>
            </div>
          </div>
          
          {/* 用户信息 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                src={entry.avatar}
                alt={entry.displayName}
                className={sizeConf.avatar}
              />
              
              {/* 状态指示器 */}
              <div className={cn(
                'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
                statusConfig.color === 'green' && 'bg-green-500',
                statusConfig.color === 'yellow' && 'bg-yellow-500',
                statusConfig.color === 'red' && 'bg-red-500',
                statusConfig.color === 'gray' && 'bg-gray-400'
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={cn('font-medium truncate', sizeConf.text)}>
                  {entry.displayName}
                </div>
                
                {isCurrentUser && (
                  <Badge variant="outline" size="sm">你</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LevelBadge level={{ id: entry.id, current: entry.level }} size="sm" />
                <span>•</span>
                <span>{formatNumber(entry.experience)} 经验</span>
              </div>
            </div>
          </div>
          
          {/* 详细信息 */}
          {showUserDetails && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">任务完成</div>
                  <div className="font-medium">{entry.stats.tasksCompleted}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">平均评分</div>
                  <div className="font-medium">{formatRating(entry.stats.averageRating)}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">连续天数</div>
                  <div className="font-medium">{entry.stats.streakDays}天</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">最后活跃</div>
                  <div className="font-medium">{formatTimeAgo(entry.lastActive)}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* 技能标签 */}
          {showSkills && entry.skills.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">主要技能</div>
              <div className="flex flex-wrap gap-1">
                {entry.skills.slice(0, 3).map((skill, index) => (
                  <SkillTag key={index} skill={{ id: skill, name: skill }} size="sm" />
                ))}
                {entry.skills.length > 3 && (
                  <Badge variant="outline" size="sm">
                    +{entry.skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          {!isCurrentUser && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onFollow}>
                关注
              </Button>
              
              <Button size="sm" variant="outline" onClick={onMessage}>
                私信
              </Button>
              
              <Button size="sm" variant="ghost" onClick={onReport}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // 列表和表格布局
  return (
    <div className={cn(
      'flex items-center gap-4 border-b border-gray-100 transition-all duration-200',
      sizeConf.padding,
      isCurrentUser && 'bg-blue-50 border-blue-200',
      onClick && 'cursor-pointer hover:bg-gray-50'
    )} onClick={onClick}>
      {/* 排名 */}
      <div className="flex items-center gap-2 w-16">
        {RankIcon ? (
          <RankIcon className={cn('w-5 h-5', rankColor)} />
        ) : (
          <div className={cn('font-bold', rankColor)}>#{entry.rank}</div>
        )}
        
        {showRankChange && entry.previousRank && (
          <div className={cn(
            'flex items-center gap-1',
            changeConfig.color === 'green' && 'text-green-600',
            changeConfig.color === 'red' && 'text-red-600',
            changeConfig.color === 'gray' && 'text-gray-600',
            changeConfig.color === 'blue' && 'text-blue-600'
          )}>
            <ChangeIcon className="w-3 h-3" />
            {Math.abs(rankChange)}
          </div>
        )}
      </div>
      
      {/* 用户信息 */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar
            src={entry.avatar}
            alt={entry.displayName}
            className={sizeConf.avatar}
          />
          
          <div className={cn(
            'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
            statusConfig.color === 'green' && 'bg-green-500',
            statusConfig.color === 'yellow' && 'bg-yellow-500',
            statusConfig.color === 'red' && 'bg-red-500',
            statusConfig.color === 'gray' && 'bg-gray-400'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn('font-medium truncate', sizeConf.text)}>
              {entry.displayName}
            </div>
            
            {isCurrentUser && (
              <Badge variant="outline" size="sm">你</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LevelBadge level={{ id: entry.id, current: entry.level }} size="sm" />
            <span>•</span>
            <span>{formatNumber(entry.experience)} 经验</span>
            {showUserDetails && (
              <>
                <span>•</span>
                <span>{entry.stats.tasksCompleted} 任务</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 技能 */}
      {showSkills && entry.skills.length > 0 && (
        <div className="hidden lg:flex items-center gap-1">
          {entry.skills.slice(0, 2).map((skill, index) => (
            <SkillTag key={index} skill={{ id: skill, name: skill }} size="sm" />
          ))}
          {entry.skills.length > 2 && (
            <Badge variant="outline" size="sm">
              +{entry.skills.length - 2}
            </Badge>
          )}
        </div>
      )}
      
      {/* 分数 */}
      <div className="text-right">
        <div className="font-bold">{formatScore(entry.score)}</div>
        {showUserDetails && (
          <div className="text-sm text-muted-foreground">
            {formatRating(entry.stats.averageRating)}★
          </div>
        )}
      </div>
      
      {/* 操作 */}
      {!isCurrentUser && (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onFollow}>
            关注
          </Button>
          
          <Button size="sm" variant="ghost" onClick={onMessage}>
            私信
          </Button>
        </div>
      )}
    </div>
  );
};

// 排行榜统计面板
interface LeaderBoardStatsPanelProps {
  stats: LeaderBoardStats;
  size: 'sm' | 'default' | 'lg';
}

const LeaderBoardStatsPanel: React.FC<LeaderBoardStatsPanelProps> = ({ stats, size }) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="font-medium">排行榜统计</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">总用户数</div>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">活跃用户</div>
            <div className="text-2xl font-bold text-green-600">{formatNumber(stats.activeUsers)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">新用户</div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.newUsers)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">最高分</div>
            <div className="text-2xl font-bold text-yellow-600">{formatScore(stats.topScore)}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">等级分布</div>
          
          <div className="space-y-1">
            {Object.entries(stats.distributionByLevel)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .slice(0, 5)
              .map(([level, count]) => {
                const percentage = (count / stats.totalUsers) * 100;
                return (
                  <div key={level} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={{ id: level, current: parseInt(level) }} size="sm" />
                      <span>等级 {level}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span>{count}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </Card>
  );
};

// 主组件
export const LeaderBoard: React.FC<LeaderBoardProps> = ({
  entries,
  type = LeaderBoardType.OVERALL,
  size = 'default',
  variant = 'default',
  layout = 'list',
  className,
  showRankChange = true,
  showStats = true,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  showExport = false,
  showRefresh = true,
  showUserDetails = true,
  showAchievements = false,
  showSkills = true,
  showProgress = false,
  currentPage = 1,
  pageSize = 20,
  total,
  currentUserId,
  filters,
  onFiltersChange,
  onUserClick,
  onUserFollow,
  onUserMessage,
  onUserReport,
  onTypeChange,
  onPageChange,
  onRefresh,
  onExport,
  renderEntry,
  renderStats
}) => {
  // 状态管理
  const [localFilters, setLocalFilters] = useState<LeaderBoardFilters>(filters || {
    type,
    skillFilter: [],
    levelRange: [1, 100],
    experienceRange: [0, 1000000],
    statusFilter: [],
    search: '',
    showOnlyFollowing: false,
    showOnlyVerified: false,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // 计算统计信息
  const stats = useMemo(() => calculateStats(entries), [entries]);
  
  // 过滤条目
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // 搜索过滤
      if (searchQuery && !entry.displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !entry.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 技能过滤
      if (localFilters.skillFilter.length > 0 && 
          !localFilters.skillFilter.some(skill => entry.skills.includes(skill))) {
        return false;
      }
      
      // 等级范围过滤
      if (entry.level < localFilters.levelRange[0] || entry.level > localFilters.levelRange[1]) {
        return false;
      }
      
      // 经验范围过滤
      if (entry.experience < localFilters.experienceRange[0] || 
          entry.experience > localFilters.experienceRange[1]) {
        return false;
      }
      
      // 状态过滤
      if (localFilters.statusFilter.length > 0 && !localFilters.statusFilter.includes(entry.status)) {
        return false;
      }
      
      return true;
    });
  }, [entries, searchQuery, localFilters]);
  
  // 分页数据
  const paginatedEntries = useMemo(() => {
    if (!showPagination) return filteredEntries;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredEntries.slice(startIndex, endIndex);
  }, [filteredEntries, currentPage, pageSize, showPagination]);
  
  // 事件处理
  const handleFiltersChange = useCallback((newFilters: LeaderBoardFilters) => {
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [onFiltersChange]);
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  const handleUserClick = useCallback((entry: LeaderBoardEntry) => {
    onUserClick?.(entry);
  }, [onUserClick]);
  
  const handleUserFollow = useCallback((userId: string) => {
    onUserFollow?.(userId);
  }, [onUserFollow]);
  
  const handleUserMessage = useCallback((userId: string) => {
    onUserMessage?.(userId);
  }, [onUserMessage]);
  
  const handleUserReport = useCallback((userId: string) => {
    onUserReport?.(userId);
  }, [onUserReport]);
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* 头部工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 类型选择 */}
        <div className="flex items-center gap-2">
          <Select
            value={type}
            onValueChange={(value) => onTypeChange?.(value as LeaderBoardType)}
          >
            {Object.entries(leaderBoardTypeConfig).map(([key, config]) => {
              const TypeIcon = config.icon;
              return (
                <option key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4" />
                    {config.label}
                  </div>
                </option>
              );
            })}
          </Select>
        </div>
        
        {/* 搜索 */}
        {showSearch && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {showFilters && (
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              过滤
            </Button>
          )}
          
          {showRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          )}
          
          {showExport && (
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* 主要内容区域 */}
        <div className="flex-1">
          {/* 排行榜列表 */}
          <Card>
            <div className="space-y-0">
              {paginatedEntries.map((entry, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index;
                const isCurrentUser = currentUserId === entry.userId;
                
                return renderEntry ? renderEntry(entry, globalIndex) : (
                  <LeaderBoardEntryComponent
                    key={entry.id}
                    entry={entry}
                    index={globalIndex}
                    size={size}
                    variant={variant}
                    layout={layout}
                    showRankChange={showRankChange}
                    showUserDetails={showUserDetails}
                    showAchievements={showAchievements}
                    showSkills={showSkills}
                    showProgress={showProgress}
                    isCurrentUser={isCurrentUser}
                    onClick={() => handleUserClick(entry)}
                    onFollow={() => handleUserFollow(entry.userId)}
                    onMessage={() => handleUserMessage(entry.userId)}
                    onReport={() => handleUserReport(entry.userId)}
                  />
                );
              })}
              
              {paginatedEntries.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg font-medium text-muted-foreground">暂无数据</div>
                  <div className="text-sm text-muted-foreground">没有找到符合条件的用户</div>
                </div>
              )}
            </div>
          </Card>
          
          {/* 分页 */}
          {showPagination && total && total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                共 {total} 个用户，每页显示 {pageSize} 个
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange?.(currentPage - 1)}
                >
                  上一页
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    const totalPages = Math.ceil(total / pageSize);
                    
                    if (page > totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => onPageChange?.(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= Math.ceil(total / pageSize)}
                  onClick={() => onPageChange?.(currentPage + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 侧边栏统计 */}
        {showStats && (
          <div className="w-80">
            {renderStats ? renderStats(stats) : (
              <LeaderBoardStatsPanel stats={stats} size={size} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};